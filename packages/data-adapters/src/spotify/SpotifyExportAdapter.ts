import type { RawMusicData, RawListeningEvent } from '@music-cosmos/domain';
import type { DataAdapter } from '../contract/DataAdapter.js';

interface SpotifyStreamEntry {
  ts: string;
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name: string | null;
  ms_played: number;
  spotify_track_uri: string | null;
}

export class SpotifyExportAdapter implements DataAdapter {
  readonly name = 'spotify-export';
  private readonly minPlayMs: number;

  constructor(options?: { minPlayMs?: number }) {
    this.minPlayMs = options?.minPlayMs ?? 30_000;
  }

  async load(jsonContent?: string): Promise<RawMusicData> {
    if (!jsonContent) throw new Error('SpotifyExportAdapter requires JSON content string');

    const raw: unknown = JSON.parse(jsonContent);
    if (!Array.isArray(raw)) throw new Error('Spotify export must be a JSON array');

    const events: RawListeningEvent[] = (raw as SpotifyStreamEntry[])
      .filter(
        (e) =>
          e.ms_played >= this.minPlayMs &&
          e.master_metadata_track_name !== null &&
          e.master_metadata_album_artist_name !== null,
      )
      .map((e) => ({
        trackTitle: e.master_metadata_track_name ?? 'Unknown Track',
        artistName: e.master_metadata_album_artist_name ?? 'Unknown Artist',
        albumTitle: e.master_metadata_album_album_name ?? undefined,
        playedAt: new Date(e.ts),
        durationPlayedMs: e.ms_played,
        externalIds: e.spotify_track_uri
          ? { spotifyId: e.spotify_track_uri.replace('spotify:track:', '') }
          : undefined,
      }));

    return { source: 'spotify-export', importedAt: new Date(), events };
  }
}
