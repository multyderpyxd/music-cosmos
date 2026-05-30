/**
 * Tags that are NOT music genres and should be excluded from genre resolution.
 * Based on common Last.fm noise tags + project-specific decisions.
 *
 * Split into three lists per spec:
 *   NON_MUSICAL_TAGS   — clearly not genres (nationalities, meta, roles)
 *   CONTEXT_TAGS       — not a genre, but useful as metadata
 *   WEAK_STYLE_TAGS    — valid genre descriptors, use only as last resort
 */

export const NON_MUSICAL_TAGS = new Set([
  // Nationalities / regions (not genres)
  'american', 'british', 'english', 'german', 'french', 'swedish', 'norwegian',
  'canadian', 'australian', 'italian', 'spanish', 'japanese', 'korean', 'chinese',
  'irish', 'scottish', 'welsh', 'dutch', 'russian', 'polish', 'latin american',
  // Decades (listening era, not genre)
  '60s', '70s', '80s', '90s', '00s', '2000s', '2010s', '2020s',
  'sixties', 'seventies', 'eighties', 'nineties',
  // Meta / listener behavior
  'seen live', 'favorites', 'favourite', 'favorite', 'loved',
  'awesome', 'good', 'cool', 'amazing', 'great', 'beautiful', 'epic',
  'all', 'various', 'misc', 'miscellaneous', 'other',
  // Musical roles (not genres)
  'male vocalists', 'female vocalists', 'male vocalist', 'female vocalist',
  'vocalist', 'singer', 'composer', 'pianist', 'guitarist', 'drummer',
  'producer', 'dj', 'mc',
  // General quality/mood (too vague)
  'mellow', 'chill', 'relaxing', 'relaxation', 'happy', 'sad', 'melancholic',
  'dark', 'emotional', 'powerful', 'energetic', 'upbeat',
  // Platform / list tags
  'spotify', 'youtube', 'bandcamp', 'soundcloud', 'apple music',
  'streaming', 'playlist',
  // Empty / single chars
  '', ' ',
]);

/**
 * Tags that are not genres but carry useful contextual metadata.
 * Don't use for galaxy/star assignment, but can store in metadata.
 */
export const CONTEXT_TAGS = new Set([
  'soundtrack', 'score', 'film score', 'ost', 'movie soundtrack',
  'video game', 'game', 'video game music', 'game music',
  'anime', 'manga', 'japanimé',
  'tv series', 'television',
  'piano', 'guitar', 'violin', 'acoustic', // instruments — are ALSO used as style descriptors
  'live', 'concert', 'session', 'demo',
  'cover', 'covers', 'tribute',
  'christmas', 'holiday', 'seasonal',
]);

/**
 * Weak style descriptors — valid genre signals but use only when no better
 * evidence exists. Keep in resolution but with reduced weight.
 */
export const WEAK_STYLE_TAGS = new Set([
  'oldies', 'classic', 'retro', 'vintage',
  'underground', 'independent', 'indie', // 'indie' is context-dependent
  'vocal', 'instrumental', 'electronic', // too broad alone
]);

/** Returns true if the tag should be excluded from genre resolution entirely. */
export function isBlacklistedTag(normalizedName: string): boolean {
  const n = normalizedName.toLowerCase().trim();
  return NON_MUSICAL_TAGS.has(n);
}

/** Returns true if the tag should be treated as context metadata, not a genre. */
export function isContextTag(normalizedName: string): boolean {
  const n = normalizedName.toLowerCase().trim();
  return CONTEXT_TAGS.has(n);
}

/** Weight multiplier for weak style tags. */
export const WEAK_STYLE_MULTIPLIER = 0.4;
export function isWeakStyleTag(normalizedName: string): boolean {
  return WEAK_STYLE_TAGS.has(normalizedName.toLowerCase().trim());
}
