import type { CosmicNode, CosmicEdge } from '@music-cosmos/cosmos-engine';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface VisualNode extends CosmicNode {
  position: Vector3;
  lod: number;
}

export interface VisualEdge extends CosmicEdge {
  sourcePosition: Vector3;
  targetPosition: Vector3;
}

export interface CameraTarget {
  nodeId: string;
  position: Vector3;
  lookAt: Vector3;
  distance: number;
}

export interface SceneMetadata {
  totalNodes: number;
  renderedNodes: number;
  seed: number;
  computedAt: Date;
}

export interface VisualScene {
  nodes: VisualNode[];
  edges: VisualEdge[];
  cameraTargets: Map<string, CameraTarget>;
  metadata: SceneMetadata;
}
