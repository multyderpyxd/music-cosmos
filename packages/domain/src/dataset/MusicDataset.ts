import type { GenreId, ArtistId, AlbumId, TrackId } from '../ids/ids.js';
import type { Genre } from '../entities/Genre.js';
import type { Artist } from '../entities/Artist.js';
import type { Album } from '../entities/Album.js';
import type { Track } from '../entities/Track.js';
import type { ListeningEvent } from '../entities/ListeningEvent.js';
import type { ListeningStats } from '../entities/ListeningStats.js';

export interface MusicDataset {
  readonly id: string;
  genres: Map<GenreId, Genre>;
  artists: Map<ArtistId, Artist>;
  albums: Map<AlbumId, Album>;
  tracks: Map<TrackId, Track>;
  stats: Map<string, ListeningStats>;
  events: ListeningEvent[];
  computedAt: Date;
  sourceAdapter: string;
}
