export type CosmicEntityType =
  | 'galaxy'
  | 'star'
  | 'planet'
  | 'satellite'
  | 'asteroid-belt'
  | 'comet'
  | 'nebula'
  | 'constellation'
  | 'supernova'
  | 'gravitational-bridge';

export interface VisualProps {
  size: number;
  brightness: number;
  color: [number, number, number];
  mass: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitPhase?: number;
  opacity?: number;
}

export interface CosmicNode {
  readonly id: string;
  readonly entityType: CosmicEntityType;
  readonly domainId: string;
  readonly parentId?: string;
  visualProps: VisualProps;
  label: string;
  metadata: Record<string, unknown>;
}

export interface CosmicEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  type: 'orbit' | 'gravitational-bridge' | 'constellation-line';
  weight: number;
}

export interface CosmicGraph {
  nodes: Map<string, CosmicNode>;
  edges: CosmicEdge[];
  rootIds: string[];
}
