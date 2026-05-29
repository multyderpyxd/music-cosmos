import type { GenreId, ArtistId, AlbumId, TrackId } from '../ids/ids.js';

export interface ListeningStats {
  readonly entityId: GenreId | ArtistId | AlbumId | TrackId;
  readonly entityType: 'genre' | 'artist' | 'album' | 'track';
  totalPlays: number;
  totalMinutes: number;
  firstPlayedAt: Date;
  lastPlayedAt: Date;
  playsLast30Days: number;
  playsLast90Days: number;
  playsLast365Days: number;
}
