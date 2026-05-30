/**
 * StatsFmApiAdapter — converts stats.fm API response data into RawMusicData.
 *
 * Field mapping (actual API names per statsfm.js SDK):
 *   item.streams  = play count  (NOT item.playCount)
 *   item.playedMs = total milliseconds listened  (NOT item.minutesListened)
 *
 * Strategy:
 *   1. Recent streams → real RawListeningEvents with real timestamps.
 *   2. Remaining lifetime plays (streams - already in recent) →
 *      synthetic events spread over 730 days with recency bias.
 */

import type { RawMusicData, RawListeningEvent } from '@music-cosmos/domain';

// Local structural type mirroring StatsFmData from apps/web/src/lib/statsFmApi.ts
// (no cross-boundary import — structural typing handles compatibility)
export interface StatsFmApiData {
  user: { customId: string };
  topTracks: Array<{
    streams: number;   // play count
    playedMs: number;  // total ms
    track: {
      name: string;
      durationMs: number;
      artists: Array<{ name: string; genres: string[] }>;
      albums: Array<{ name: string; releaseDate?: string }>;
    };
  }>;
  recentStreams: Array<{
    endTime: string;
    playedMs: number;
    track: {
      name: string;
      durationMs: number;
      artists: Array<{ name: string; genres: string[] }>;
      albums: Array<{ name: string }>;
    };
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

    // ── 2. Synthetic events for remaining lifetime plays ─────────────────────
    // item.streams = lifetime play count from stats.fm
    for (const item of data.topTracks) {
      const artist = item.track.artists[0];
      const album  = item.track.albums[0];
      if (!artist) continue;

      const key = `${artist.name}::${item.track.name}`;
      const alreadyAccounted = recentPlays.get(key) ?? 0;
      // item.streams is the lifetime play count
      const remaining = Math.max(0, item.streams - alreadyAccounted);
      if (remaining === 0) continue;

      for (let i = 0; i < remaining; i++) {
        // Recency bias: more plays near present
        const t = Math.pow(Math.random(), 1.5);
        const daysAgo = t * 730;
        const playedAt = new Date(now.getTime() - daysAgo * 86_400_000);
        // Use actual playedMs from top track as average duration if available
        const avgDuration = item.playedMs > 0 && item.streams > 0
          ? Math.round(item.playedMs / item.streams)
          : (item.track.durationMs || 180_000);

        events.push({
          trackTitle:       item.track.name,
          artistName:       artist.name,
          albumTitle:       album?.name,
          playedAt,
          durationPlayedMs: avgDuration,
          genreHint:        artist.genres[0],
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
