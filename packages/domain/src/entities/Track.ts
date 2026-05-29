import type { TrackId, ArtistId, AlbumId, GenreId } from '../ids/ids.js';
import type { ExternalIds } from '../value-objects/ExternalIds.js';

export interface Track {
  readonly id: TrackId;
  title: string;
  artistId: ArtistId;
  albumId?: AlbumId;
  durationMs?: number;
  genreIds: GenreId[];
  externalIds: ExternalIds;
  isUnknown: boolean;
}
