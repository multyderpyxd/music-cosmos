import type { GenreId } from '../ids/ids.js';
import type { ExternalIds } from '../value-objects/ExternalIds.js';

export interface Genre {
  readonly id: GenreId;
  name: string;
  parentGenreId?: GenreId;
  aliases: string[];
  externalIds: ExternalIds;
}
