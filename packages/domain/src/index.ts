export type { GenreId, ArtistId, AlbumId, TrackId, PlaylistId } from './ids/ids.js';
export { genreId, artistId, albumId, trackId, playlistId } from './ids/ids.js';

export type { AlbumType } from './value-objects/AlbumType.js';
export type { ExternalIds } from './value-objects/ExternalIds.js';
export type { DateRange } from './value-objects/DateRange.js';

export type { Genre } from './entities/Genre.js';
export type { Artist } from './entities/Artist.js';
export type { Album } from './entities/Album.js';
export type { Track } from './entities/Track.js';
export type { Playlist } from './entities/Playlist.js';
export type { ListeningEvent } from './entities/ListeningEvent.js';
export type { ListeningStats } from './entities/ListeningStats.js';

export type { RawListeningEvent, RawMusicData, ResolutionStatus } from './dataset/RawMusicData.js';
export type { MusicDataset } from './dataset/MusicDataset.js';
export type { GenreEvidence, GenreEvidenceSource } from './dataset/GenreEvidence.js';
export type { ProfileSignal, ProfileSignalKind, ProfileSignalRange, DataProvenance, DataSourceKind } from './dataset/ProfileSignal.js';
export type { DataQualityReport } from './dataset/DataQualityReport.js';
