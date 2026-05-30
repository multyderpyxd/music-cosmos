import type { ExternalIds } from '../value-objects/ExternalIds.js';
import type { GenreEvidence } from './GenreEvidence.js';

/** Origin of a profile signal — reflects what API / source produced it. */
export type ProfileSignalKind =
  | 'statsfm-top-artist'
  | 'statsfm-top-track'
  | 'spotify-top-artist'
  | 'spotify-top-track'
  | 'spotify-followed-artist'
  | 'manual-favorite';

export type ProfileSignalRange =
  | 'short_term'
  | 'medium_term'
  | 'long_term'
  | 'lifetime'
  | 'unknown';

export type DataSourceKind =
  | 'statsfm-stream'
  | 'statsfm-export'
  | 'spotify-extended-history'
  | 'spotify-profile'
  | 'lastfm'
  | 'musicbrainz'
  | 'manual'
  | 'mock';

export interface DataProvenance {
  source: DataSourceKind;
  adapter: string;
  importedAt: Date;
  sourceRecordId?: string;
  /** 1 = fully verified real data, <1 = approximate/inferred */
  confidence: number;
}

/**
 * A profile signal represents affinity data (rankings, followed artists, etc.)
 * that is NOT a concrete listening event. It must NOT be converted to plays,
 * minutes, or artificial lastPlayedAt values.
 */
export interface ProfileSignal {
  kind: ProfileSignalKind;
  range: ProfileSignalRange;

  artistName?: string;
  trackTitle?: string;
  albumTitle?: string;

  artistExternalIds?: ExternalIds & { statsfm?: string; spotify?: string; musicbrainz?: string };
  trackExternalIds?: ExternalIds & { statsfm?: string; spotify?: string; isrc?: string };
  albumExternalIds?: ExternalIds & { statsfm?: string; spotify?: string; upc?: string };

  /** 1-based ranking position from the API. */
  position?: number;
  /** Actual stream count if the source provides it; null/undefined if not available. */
  streamCount?: number | null;
  /** Internal affinity score derived from position/term — NOT a play count. */
  affinityScore?: number;

  imageUrl?: string;
  /** Spotify/stats.fm popularity metric — visual metadata only, not affinity. */
  popularity?: number;
  genreEvidence?: GenreEvidence[];

  provenance: DataProvenance;
}
