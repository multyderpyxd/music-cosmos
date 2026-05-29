import type { AlbumId, ArtistId, GenreId, TrackId } from '../ids/ids.js';
import type { AlbumType } from '../value-objects/AlbumType.js';
import type { ExternalIds } from '../value-objects/ExternalIds.js';

export interface Album {
  readonly id: AlbumId;
  title: string;
  artistId: ArtistId;
  type: AlbumType;
  releaseYear?: number;
  genreIds: GenreId[];
  trackIds: TrackId[];
  externalIds: ExternalIds;
  isUnknown: boolean;
}
