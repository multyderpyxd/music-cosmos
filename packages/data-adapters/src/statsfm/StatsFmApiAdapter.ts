/**
 * StatsFmApiAdapter — converts real stats.fm API data into RawMusicData.
 *
 * Real API constraints discovered from live inspection:
 *   - topArtists/topTracks: streams=null (no imported history) → use position rank
 *   - recentStreams: flat items with trackName + artistIds[] (no artist name, no genres)
 *   - track.artists[] has id/name but no genres; genres only in topArtists.artist
 *
 * Strategy:
 *   1. Build genre map: artistName → genre  (from topArtists which has genres)
 *   2. Build track lookup: trackName → topTrack item  (to resolve artist for streams)
 *   3. Real events from recentStreams (matched via trackName to get artist)
 *   4. Synthetic events from topTracks using position-based play count
 *      (position 1 ≈ 200 plays, position 100 ≈ 18 plays via 200 / pos^0.6)
 */

import type { RawMusicData, RawListeningEvent } from '@music-cosmos/domain';

// Local structural type — mirrors StatsFmData from apps/web without importing it
export interface StatsFmApiData {
  user: { customId: string };
  topArtists: Array<{
    position: number;
    streams: number | null;
    artist: {
      id: number;
      name: string;
      genres: string[];
    };
  }>;
  topTracks: Array<{
    position: number;
    streams: number | null;
    track: {
      id: number;
      name: string;
      durationMs: number;
      artists: Array<{ id: number; name: string }>;
      albums: Array<{ id: number; name: string }>;
    };
  }>;
  recentStreams: Array<{
    endTime: string;
    playedMs: number;
    trackName: string;       // flat string field
    artistIds: number[];     // numeric IDs only — no artist names
  }>;
  fetchedAt: number;
}

/** Synthetic plays from rank position: pos1≈200, pos10≈95, pos50≈50, pos100≈32 */
function playsFromPosition(position: number): number {
  return Math.max(2, Math.round(200 / Math.pow(position, 0.55)));
}

export class StatsFmApiAdapter {
  readonly name = 'statsfm-api';

  convert(data: StatsFmApiData): RawMusicData {
    const events: RawListeningEvent[] = [];
    const now = new Date();

    // ── Genre map: artistName.lower → primary genre ──────────────────────────
    // Built from topArtists since that's the only source of genre info.
    const artistGenres = new Map<string, string>();
    const artistIdToName = new Map<number, string>();
    for (const item of data.topArtists) {
      const { name, genres, id } = item.artist;
      artistIdToName.set(id, name);
      if (genres.length > 0) artistGenres.set(name.toLowerCase(), genres[0]!);
    }

    // ── Track lookup: trackName.lower → topTrack item ─────────────────────────
    // Used to resolve artist name for recentStreams (which only have trackName).
    const trackByName = new Map<string, StatsFmApiData['topTracks'][0]>();
    for (const item of data.topTracks) {
      trackByName.set(item.track.name.toLowerCase(), item);
    }

    // ── 1. Real events from recentStreams ────────────────────────────────────
    const recentTrackPlays = new Map<string, number>();  // key → how many we've already counted

    for (const stream of data.recentStreams) {
      if (!stream.trackName || !stream.endTime) continue;

      // Look up artist via trackName → topTracks match
      const matched = trackByName.get(stream.trackName.toLowerCase());
      const artistName = matched?.track.artists[0]?.name;
      if (!artistName) continue;  // can't add without artist name

      const albumName = matched?.track.albums[0]?.name;
      const genre = artistGenres.get(artistName.toLowerCase());
      const key = `${artistName}::${stream.trackName}`;
      recentTrackPlays.set(key, (recentTrackPlays.get(key) ?? 0) + 1);

      events.push({
        trackTitle:       stream.trackName,
        artistName,
        albumTitle:       albumName,
        playedAt:         new Date(stream.endTime),
        durationPlayedMs: stream.playedMs > 0 ? stream.playedMs : (matched?.track.durationMs ?? 180_000),
        genreHint:        genre,
      });
    }

    // ── 2. Synthetic events from topTracks position rank ─────────────────────
    // streams=null for users without imported history, so position is all we have.
    for (const item of data.topTracks) {
      const trackName  = item.track.name;
      const artistName = item.track.artists[0]?.name;
      if (!trackName || !artistName) continue;

      const albumName  = item.track.albums[0]?.name;
      const genre      = artistGenres.get(artistName.toLowerCase());
      const key        = `${artistName}::${trackName}`;
      const alreadyCounted = recentTrackPlays.get(key) ?? 0;
      const synthetic  = Math.max(0, playsFromPosition(item.position) - alreadyCounted);

      for (let i = 0; i < synthetic; i++) {
        const t = Math.pow(Math.random(), 1.5);  // recency bias
        events.push({
          trackTitle:       trackName,
          artistName,
          albumTitle:       albumName,
          playedAt:         new Date(now.getTime() - t * 730 * 86_400_000),
          durationPlayedMs: item.track.durationMs || 180_000,
          genreHint:        genre,
        });
      }
    }

    events.sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

    return {
      source:     `statsfm-api:${data.user.customId}`,
      importedAt: new Date(data.fetchedAt),
      events,
    };
  }
}
