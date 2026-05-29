import type { ViewMode } from '@music-cosmos/config';
import type { VisualScene, VisualNode } from '../types/VisualScene.js';

export function viewModeToMaxLod(viewMode: ViewMode): number {
  switch (viewMode) {
    case 'universe': return 0;
    case 'galaxy':   return 1;
    case 'artist':   return 2;
    case 'album':    return 3;
  }
}

export function filterSceneByViewMode(scene: VisualScene, viewMode: ViewMode): VisualScene {
  const maxLod = viewModeToMaxLod(viewMode);
  const visibleNodeIds = new Set<string>();
  const visibleNodes: VisualNode[] = [];

  for (const node of scene.nodes) {
    if (node.lod <= maxLod) {
      visibleNodes.push(node);
      visibleNodeIds.add(node.id);
    }
  }

  const visibleEdges = scene.edges.filter(
    (e) => visibleNodeIds.has(e.sourceId) && visibleNodeIds.has(e.targetId),
  );

  return {
    ...scene,
    nodes: visibleNodes,
    edges: visibleEdges,
    metadata: {
      ...scene.metadata,
      renderedNodes: visibleNodes.length,
    },
  };
}
