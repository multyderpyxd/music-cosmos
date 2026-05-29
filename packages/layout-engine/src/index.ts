import type { CosmicGraph } from '@music-cosmos/cosmos-engine';
import type { LayoutConfig, RenderBudget, ViewMode } from '@music-cosmos/config';
import { mulberry32 } from './prng/mulberry32.js';
import { positionGalaxies } from './galaxy-layout/galaxyPositioner.js';
import { distributeStars } from './star-layout/starDistributor.js';
import type { VisualScene, VisualNode, VisualEdge, Vector3 } from './types/VisualScene.js';
import { filterSceneByViewMode } from './lod/lodFilter.js';

export type { VisualScene, VisualNode, VisualEdge, Vector3, CameraTarget, SceneMetadata } from './types/VisualScene.js';
export { mulberry32 } from './prng/mulberry32.js';
export { positionGalaxies } from './galaxy-layout/galaxyPositioner.js';
export { distributeStars } from './star-layout/starDistributor.js';
export { filterSceneByViewMode, viewModeToMaxLod } from './lod/lodFilter.js';

function lodForEntityType(entityType: string): number {
  switch (entityType) {
    case 'galaxy':        return 0;
    case 'star':          return 1;
    case 'planet':        return 2;
    case 'satellite':
    case 'asteroid-belt': return 3;
    default:              return 3;
  }
}

export function computeLayout(
  graph: CosmicGraph,
  config: LayoutConfig,
  _budget: RenderBudget,
  viewMode: ViewMode,
): VisualScene {
  const rng = mulberry32(config.seed);

  const galaxyNodeIds = graph.rootIds;
  const galaxyPositions = positionGalaxies(
    galaxyNodeIds,
    config.galaxySpread,
    config.seed,
    config.galaxyPositions,
  );

  const nodePositions = new Map<string, Vector3>();

  for (const [id, pos] of galaxyPositions) {
    nodePositions.set(id, pos);
  }

  const galaxyStarIds = new Map<string, string[]>();
  for (const [nodeId, node] of graph.nodes) {
    if (node.entityType === 'star' && node.parentId) {
      const existing = galaxyStarIds.get(node.parentId) ?? [];
      existing.push(nodeId);
      galaxyStarIds.set(node.parentId, existing);
    }
  }

  for (const [galaxyId, starIds] of galaxyStarIds) {
    const galaxyPos = nodePositions.get(galaxyId) ?? { x: 0, y: 0, z: 0 };
    const galaxyNode = graph.nodes.get(galaxyId);
    const galaxyRadius = galaxyNode ? galaxyNode.visualProps.size * 0.5 : 50;
    const starPositions = distributeStars(starIds, galaxyPos, galaxyRadius, config.seed ^ galaxyId.charCodeAt(5));
    for (const [sid, spos] of starPositions) {
      nodePositions.set(sid, spos);
    }
  }

  for (const [nodeId, node] of graph.nodes) {
    if (node.entityType === 'planet' || node.entityType === 'satellite' || node.entityType === 'asteroid-belt') {
      const parentPos = node.parentId ? (nodePositions.get(node.parentId) ?? { x: 0, y: 0, z: 0 }) : { x: 0, y: 0, z: 0 };
      const orbitRadius = node.visualProps.orbitRadius ?? 10;
      const phase = rng() * 2 * Math.PI;
      node.visualProps.orbitPhase = phase;
      nodePositions.set(nodeId, {
        x: parentPos.x + orbitRadius * Math.cos(phase),
        y: parentPos.y + (rng() - 0.5) * orbitRadius * 0.1,
        z: parentPos.z + orbitRadius * Math.sin(phase),
      });
    }
  }

  const visualNodes: VisualNode[] = [];
  const cameraTargets = new Map<string, import('./types/VisualScene.js').CameraTarget>();

  for (const [nodeId, node] of graph.nodes) {
    const position = nodePositions.get(nodeId) ?? { x: 0, y: 0, z: 0 };
    const lod = lodForEntityType(node.entityType);
    const visualNode: VisualNode = { ...node, position, lod };
    visualNodes.push(visualNode);

    if (node.entityType === 'star' || node.entityType === 'galaxy' || node.entityType === 'planet') {
      cameraTargets.set(nodeId, {
        nodeId,
        position: {
          x: position.x + (node.visualProps.size ?? 20) * 3,
          y: position.y + (node.visualProps.size ?? 20) * 1.5,
          z: position.z + (node.visualProps.size ?? 20) * 3,
        },
        lookAt: position,
        distance: (node.visualProps.size ?? 20) * 3,
      });
    }
  }

  const visualEdges: VisualEdge[] = graph.edges.map((edge) => ({
    ...edge,
    sourcePosition: nodePositions.get(edge.sourceId) ?? { x: 0, y: 0, z: 0 },
    targetPosition: nodePositions.get(edge.targetId) ?? { x: 0, y: 0, z: 0 },
  }));

  const rawScene: VisualScene = {
    nodes: visualNodes,
    edges: visualEdges,
    cameraTargets,
    metadata: {
      totalNodes: visualNodes.length,
      renderedNodes: visualNodes.length,
      seed: config.seed,
      computedAt: new Date(),
    },
  };

  return filterSceneByViewMode(rawScene, viewMode);
}
