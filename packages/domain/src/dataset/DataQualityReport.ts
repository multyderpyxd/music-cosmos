export interface DataQualityReport {
  importedAt: Date;
  sourceAdapter: string;

  /** Total raw events in the import file/API response. */
  rawEvents: number;
  /** Events with full resolution (artistName + trackName + timestamp). */
  realEvents: number;
  /** Events kept but missing some fields (e.g. no artistName). */
  partialEvents: number;
  /** Events dropped because they were completely unresolvable. */
  unresolvedEvents: number;

  profileSignals: number;
  rankingSignals: number;
  followedSignals: number;

  /**
   * Number of synthetic/artificial listening events created by the adapter.
   * MUST be 0 for any non-mock adapter. A non-zero value here is a bug.
   */
  syntheticEventsCreated: number;

  tracksMatchedById: number;
  tracksMatchedByName: number;
  tracksUnmatched: number;

  artistsTotal: number;
  artistsWithGenre: number;
  artistsWithoutGenre: number;
  /** Fraction [0..1] of artists that have at least one resolved genre. */
  genreCoverageRatio: number;

  genresFromStatsFm: number;
  genresFromSpotify: number;
  genresFromLastFm: number;
  genresFromMusicBrainz: number;
  genresUnknown: number;

  warnings: string[];
}
