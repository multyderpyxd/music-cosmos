import type { Vector3 } from '../types/VisualScene.js';
import { mulberry32 } from '../prng/mulberry32.js';

const PHI = (1 + Math.sqrt(5)) / 2;

export function fibonacciSpherePoint(i: number, total: number, radius: number): Vector3 {
  const theta = Math.acos(1 - (2 * (i + 0.5)) / total);
  const phi = (2 * Math.PI * i) / PHI;
  return {
    x: radius * Math.sin(theta) * Math.cos(phi),
    y: radius * Math.sin(theta) * Math.sin(phi),
    z: radius * Math.cos(theta),
  };
}

export function positionGalaxies(
  galaxyIds: string[],
  spread: number,
  seed: number,
  manualPositions?: Record<string, readonly [number, number, number]>,
): Map<string, Vector3> {
  const positions = new Map<string, Vector3>();
  const rng = mulberry32(seed);

  galaxyIds.forEach((id, i) => {
    if (manualPositions?.[id]) {
      const [x, y, z] = manualPositions[id];
      positions.set(id, { x, y, z });
      return;
    }
    const base = fibonacciSpherePoint(i, Math.max(galaxyIds.length, 1), spread);
    const jitter = spread * 0.05;
    positions.set(id, {
      x: base.x + (rng() - 0.5) * jitter,
      y: base.y + (rng() - 0.5) * jitter,
      z: base.z + (rng() - 0.5) * jitter,
    });
  });

  return positions;
}
