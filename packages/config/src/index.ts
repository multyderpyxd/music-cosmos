export type { ScaleMethod, GalaxyVisualRule, StarVisualRule, PlanetVisualRule, SatelliteVisualRule, VisualRules } from './visual-rules.js';
export { defaultVisualRules } from './visual-rules.js';

export type { ViewMode, UniverseViewBudget, GalaxyViewBudget, ArtistViewBudget, AlbumViewBudget, RenderBudget } from './render-budget.js';
export { defaultRenderBudget } from './render-budget.js';

export type { LayoutConfig } from './layout-config.js';
export { defaultLayoutConfig } from './layout-config.js';

export type { GenreDefinition } from './genre-map.js';
export { genreDefinitions, genreAliasMap, fallbackGenreId } from './genre-map.js';

export type { GenreTaxonomyEntry } from './genre-taxonomy.js';
export { MACRO_GENRES, SUB_GENRES, ALL_GENRES, FULL_GENRE_ALIAS_MAP, lookupGenre, buildGenreAliasMap, fallbackGenreEntry } from './genre-taxonomy.js';

export type { FeatureFlags } from './feature-flags.js';
export { defaultFeatureFlags } from './feature-flags.js';

export { linearScale, logScale, sqrtScale, recencyDecay, scaleByMethod } from './scalers.js';
