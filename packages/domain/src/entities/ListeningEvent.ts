import type { TrackId, ArtistId, AlbumId } from '../ids/ids.js';

export interface ListeningEvent {
  readonly id: string;
  readonly trackId: TrackId;
  readonly artistId: ArtistId;
  readonly albumId?: AlbumId;
  readonly playedAt: Date;
  readonly durationPlayedMs: number;
  readonly sourceAdapter: string;
}
