export type { CosmicEntityType, VisualProps, CosmicNode, CosmicEdge, CosmicGraph } from './types/CosmicTypes.js';
export { mapDatasetToCosmicGraph } from './mapping/CosmosMapper.js';
export { makeGalaxyProps, makeStarProps, makePlanetProps, makeSatelliteProps } from './mapping/visualPropsFactory.js';
export type { StatRange } from './mapping/visualPropsFactory.js';
