import type { GenreId, ArtistId, AlbumId, TrackId } from '../ids/ids.js';
import type { Genre } from '../entities/Genre.js';
import type { Artist } from '../entities/Artist.js';
import type { Album } from '../entities/Album.js';
import type { Track } from '../entities/Track.js';
import type { ListeningEvent } from '../entities/ListeningEvent.js';
import type { ListeningStats } from '../entities/ListeningStats.js';
import type { AffinityStats } from '../entities/AffinityStats.js';
import type { DataQualityReport } from './DataQualityReport.js';

export interface MusicDataset {
  readonly id: string;
  genres: Map<GenreId, Genre>;
  artists: Map<ArtistId, Artist>;
  albums: Map<AlbumId, Album>;
  tracks: Map<TrackId, Track>;
  /** Real listening stats — aggregated from ListeningEvent[] only. */
  stats: Map<string, ListeningStats>;
  /**
   * Affinity stats from profile signals (rankings, followed, etc.).
   * Separate from stats — must NOT be used as play counts or minutes.
   */
  affinityStats?: Map<string, AffinityStats>;
  events: ListeningEvent[];
  computedAt: Date;
  sourceAdapter: string;
  dataQuality?: DataQualityReport;
}
