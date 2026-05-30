export { normalize } from './pipeline/normalizationPipeline.js';
export type { NormalizationConfig } from './pipeline/normalizationPipeline.js';
export { aggregateStats } from './metrics/metricsAggregator.js';
export { linearScale, logScale, sqrtScale, recencyDecay, scaleByMethod } from './metrics/scalers.js';
export { normalizeArtistName, normalizeTrackTitle, normalizeAlbumTitle } from './dedupe/artistNormalizer.js';
export { resolveGenres } from './genre/GenreResolver.js';
export type { ResolvedGenres } from './genre/GenreResolver.js';
export { normalizeGenreName } from './genre/normalizeGenreName.js';
export { isBlacklistedTag, isContextTag, isWeakStyleTag } from './genre/tagBlacklist.js';
