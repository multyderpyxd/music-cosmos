/**
 * GenreResolver — resolves GenreEvidence[] into weighted genre IDs.
 *
 * Features:
 * - Multi-source weighted scoring (statsfm > spotify > lastfm > ...)
 * - Parent macro-genre gets partial credit from sub-genre evidence
 * - Returns up to 3 genre IDs sorted by score
 * - Fully deterministic — no randomness
 * - Confidence = score of the winning genre (capped at 1)
 */

import { genreId } from '@music-cosmos/domain';
import type { GenreId, GenreEvidence } from '@music-cosmos/domain';
import { FULL_GENRE_ALIAS_MAP, ALL_GENRES } from '@music-cosmos/config';
import { normalizeGenreName } from './normalizeGenreName.js';
import { isBlacklistedTag, isWeakStyleTag, WEAK_STYLE_MULTIPLIER } from './tagBlacklist.js';

export interface ResolvedGenres {
  primaryGenreId: GenreId;
  genreIds: GenreId[];
  evidence: GenreEvidence[];
  confidence: number;
  usedFallback: boolean;
}

const FALLBACK_GENRE_ID = genreId('g:unknown');
const MAX_GENRE_IDS = 3;
/** Fraction of score that propagates from sub-genre to parent macro-genre. */
const PARENT_CREDIT = 0.35;

/** Build parent lookup once at module level. */
const PARENT_OF = new Map<string, string>();
for (const g of ALL_GENRES) {
  if (g.parentId) PARENT_OF.set(g.id, g.parentId);
}

/**
 * Resolve a list of genre evidence items to primary + secondary genre IDs.
 *
 * @param evidence  GenreEvidence[] from all sources (stats.fm, Spotify, Last.fm …)
 * @param legacyHint  Optional legacy genreHint string for backward compat
 */
export function resolveGenres(
  evidence: GenreEvidence[],
  legacyHint?: string,
): ResolvedGenres {
  const scored = new Map<string, number>();
  const retainedEvidence: GenreEvidence[] = [];

  // Include legacy hint as minimal-weight evidence for backward compat
  const allEvidence: GenreEvidence[] = [...evidence];
  if (legacyHint) {
    allEvidence.push({
      rawName: legacyHint,
      normalizedName: normalizeGenreName(legacyHint),
      source: 'taxonomy-alias',
      weight: 0.50,
      confidence: 0.50,
    });
  }

  for (const item of allEvidence) {
    const normalized = normalizeGenreName(item.normalizedName || item.rawName);
    if (!normalized || isBlacklistedTag(normalized)) continue;

    // Look up the genre ID from the taxonomy
    const resolvedId = FULL_GENRE_ALIAS_MAP.get(normalized);
    if (!resolvedId) {
      // Unknown tag — not in ontology, skip (or could add as dynamic in future)
      continue;
    }

    const weakMultiplier = isWeakStyleTag(normalized) ? WEAK_STYLE_MULTIPLIER : 1;
    const score = item.weight * item.confidence * weakMultiplier;

    scored.set(resolvedId, (scored.get(resolvedId) ?? 0) + score);

    // Propagate partial credit to parent macro-genre
    const parentId = PARENT_OF.get(resolvedId);
    if (parentId) {
      scored.set(parentId, (scored.get(parentId) ?? 0) + score * PARENT_CREDIT);
    }

    retainedEvidence.push({ ...item, normalizedName: normalized });
  }

  if (scored.size === 0) {
    return {
      primaryGenreId: FALLBACK_GENRE_ID,
      genreIds: [FALLBACK_GENRE_ID],
      evidence: retainedEvidence,
      confidence: 0,
      usedFallback: true,
    };
  }

  const ranked = [...scored.entries()].sort((a, b) => b[1] - a[1]);
  const topIds = ranked.slice(0, MAX_GENRE_IDS).map(([id]) => genreId(id));

  return {
    primaryGenreId: topIds[0]!,
    genreIds: topIds,
    evidence: retainedEvidence,
    confidence: Math.min(1, ranked[0]![1]),
    usedFallback: false,
  };
}
