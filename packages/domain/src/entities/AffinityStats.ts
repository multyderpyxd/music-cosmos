import type { ProfileSignalKind, ProfileSignalRange } from '../dataset/ProfileSignal.js';

export type MetricBasis = 'listening-events' | 'profile-affinity' | 'mixed' | 'unknown';

export interface AffinityScoreBasis {
  source: ProfileSignalKind;
  range: ProfileSignalRange;
  contribution: number;
  position?: number;
}

/**
 * Affinity signal derived from rankings/followed artists.
 * NOT listening data — score must never appear as plays or minutes.
 */
export interface AffinityStats {
  readonly entityId: string;
  readonly entityType: 'artist' | 'track' | 'album' | 'genre';
  /** Total affinity score. Higher = more affinity. NOT equivalent to plays. */
  score: number;
  scoreBasis: AffinityScoreBasis[];
  /** True if real listening events also exist for this entity. */
  hasRealListeningEvents: boolean;
  /** Which basis was used to size this entity visually. */
  metricBasis: MetricBasis;
}
