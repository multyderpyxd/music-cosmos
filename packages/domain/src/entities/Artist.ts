import type { ArtistId, GenreId } from '../ids/ids.js';
import type { ExternalIds } from '../value-objects/ExternalIds.js';

export interface Artist {
  readonly id: ArtistId;
  name: string;
  normalizedName: string;
  primaryGenreId: GenreId;
  genreIds: GenreId[];
  aliases: string[];
  externalIds: ExternalIds;
  isUnknown: boolean;
}
