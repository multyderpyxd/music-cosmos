/**
 * StatsFmApiAdapter — converts stats.fm API response data into RawMusicData.
 *
 * Receives the already-fetched data object (from apps/web/src/lib/statsFmApi.ts)
 * as a plain JS object. Uses a local structural type — no import from apps/.
 *
 * Strategy:
 *   1. Recent streams → real RawListeningEvents with real timestamps.
 *   2. Remaining plays from topTracks → synthetic events spread over 2 years,
 *      with recency bias, to account for the lifetime play counts.
 */

import type { RawMusicData, RawListeningEvent } from '@music-cosmos/domain';

// Local structural type — mirrors StatsFmData from apps/web/src/lib/statsFmApi.ts
// Any object with this shape is accepted; no cross-boundary import needed.
export interface StatsFmApiData {
  user: { customId: string };
  topTracks: Array<{
    track: {
      name: string;
      durationMs: number;
      artists: Array<{ name: string; genres: string[] }>;
      albums: Array<{ name: string; releaseDate?: string }>;
    };
    playCount: number;
  }>;
  recentStreams: Array<{
    endTime: string;
    track: {
      name: string;
      durationMs: number;
      artists: Array<{ name: string; genres: string[] }>;
      albums: Array<{ name: string }>;
    };
    playedMs: number;
  }>;
  fetchedAt: number;
}

export class StatsFmApiAdapter {
  readonly name = 'statsfm-api';

  convert(data: StatsFmApiData): RawMusicData {
    const events: RawListeningEvent[] = [];
    const now = new Date();

    // ── 1. Real events from recent streams ───────────────────────────────────
    const recentPlays = new Map<string, number>();

    for (const stream of data.recentStreams) {
      const artist = stream.track.artists[0];
      const album  = stream.track.albums[0];
      if (!artist) continue;

      const key = `${artist.name}::${stream.track.name}`;
      recentPlays.set(key, (recentPlays.get(key) ?? 0) + 1);

      events.push({
        trackTitle:       stream.track.name,
        artistName:       artist.name,
        albumTitle:       album?.name,
        playedAt:         new Date(stream.endTime),
        durationPlayedMs: stream.playedMs > 0 ? stream.playedMs : stream.track.durationMs,
        genreHint:        artist.genres[0],
      });
    }

    // ── 2. Synthetic events for the remaining lifetime plays ─────────────────
    // For each top track, we already have the recent plays from above.
    // We generate additional events to represent the remaining plays
    // distributed over the past ~730 days with a recency bias.

    for (const item of data.topTracks) {
      const artist = item.track.artists[0];
      const album  = item.track.albums[0];
      if (!artist) continue;

      const key = `${artist.name}::${item.track.name}`;
      const alreadyAccounted = recentPlays.get(key) ?? 0;
      const remaining = Math.max(0, item.playCount - alreadyAccounted);
      if (remaining === 0) continue;

      for (let i = 0; i < remaining; i++) {
        // Math.pow biases random toward 0 (= recent), simulating higher
        // activity in recent months vs distant past.
        const t = Math.pow(Math.random(), 1.5);
        const daysAgo = t * 730;
        const playedAt = new Date(now.getTime() - daysAgo * 86_400_000);

        events.push({
          trackTitle:       item.track.name,
          artistName:       artist.name,
          albumTitle:       album?.name,
          playedAt,
          durationPlayedMs: item.track.durationMs || 180_000,
          genreHint:        artist.genres[0],
        });
      }
    }

    // Chronological order (not strictly required but makes debugging easier)
    events.sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

    return {
      source:     `statsfm-api:${data.user.customId}`,
      importedAt: new Date(data.fetchedAt),
      events,
    };
  }
}
