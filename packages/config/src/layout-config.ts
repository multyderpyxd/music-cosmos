export interface LayoutConfig {
  seed: number;
  lodLevels: number;
  galaxySpread: number;
  orbitScale: number;
  galaxyPositions?: Record<string, readonly [number, number, number]>;
}

export const defaultLayoutConfig: LayoutConfig = {
  seed: 42,
  lodLevels: 4,
  galaxySpread: 500,
  orbitScale: 1.0,
};
