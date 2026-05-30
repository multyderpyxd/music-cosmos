import type { ExternalIds } from '../value-objects/ExternalIds.js';
import type { GenreEvidence } from './GenreEvidence.js';
import type { ProfileSignal, DataProvenance } from './ProfileSignal.js';
import type { DataQualityReport } from './DataQualityReport.js';

export type ResolutionStatus = 'resolved' | 'partial' | 'unresolved';

export interface RawListeningEvent {
  trackTitle: string;
  /**
   * artistName is OPTIONAL. Streams may arrive without a resolved artist
   * (e.g. stats.fm streams with numeric artistIds only). Do not drop these
   * events — preserve them as 'partial' so real timestamps are kept.
   */
  artistName?: string;
  albumTitle?: string;

  /** Real timestamp from the source. MUST NOT be an invented date from a ranking. */
  playedAt: Date;
  /** Actual milliseconds played, from the source. */
  durationPlayedMs: number;

  externalIds?: ExternalIds;
  trackExternalIds?: ExternalIds & { statsfm?: string; spotify?: string; isrc?: string };
  artistExternalIds?: ExternalIds & { statsfm?: string; spotify?: string };
  albumExternalIds?: ExternalIds & { statsfm?: string; spotify?: string };

  /**
   * Replaces genreHint. Multiple weighted evidence items from different sources.
   * @deprecated genreHint is kept for backward compat — prefer genreEvidence.
   */
  genreHint?: string;
  genreEvidence?: GenreEvidence[];

  /** Optional provenance for tracking where this event came from. */
  provenance?: DataProvenance;
  /** Resolution quality of this event. 'partial' = missing some fields but kept. */
  resolutionStatus?: ResolutionStatus;
}

export interface RawMusicData {
  source: string;
  importedAt: Date;
  /** Real listening events with actual timestamps. Must NOT include synthetic events. */
  events: RawListeningEvent[];
  /**
   * Profile affinity signals (rankings, followed artists, etc.).
   * NOT listening events — must NOT be converted to plays/minutes/dates.
   */
  profileSignals?: ProfileSignal[];
  /** Data quality metrics from the adapter. syntheticEventsCreated must be 0 for non-mock. */
  importDiagnostics?: DataQualityReport;
}
