export type GenreEvidenceSource =
  | 'statsfm'
  | 'spotify'
  | 'lastfm'
  | 'musicbrainz'
  | 'wikidata'
  | 'manual'
  | 'taxonomy-alias';

export interface GenreEvidence {
  rawName: string;
  normalizedName: string;
  source: GenreEvidenceSource;
  /** Reliability weight of the source (0–1). statsfm≈0.85, lastfm≈0.65, manual=0.9 */
  weight: number;
  /** Confidence for this specific tag (0–1). May be lower than weight for noisy tags. */
  confidence: number;
  /** Vote/popularity count if the API provides it (e.g. Last.fm tag count). */
  count?: number;
}
