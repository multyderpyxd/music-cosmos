import type { Vector3 } from '../types/VisualScene.js';
import { mulberry32 } from '../prng/mulberry32.js';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function vogelSpiralPoint(i: number, maxRadius: number): { x: number; z: number } {
  const r = maxRadius * Math.sqrt((i + 0.5) / Math.max(i + 1, 1));
  const theta = GOLDEN_ANGLE * i;
  return { x: r * Math.cos(theta), z: r * Math.sin(theta) };
}

export function distributeStars(
  starIds: string[],
  galaxyCenter: Vector3,
  galaxyRadius: number,
  seed: number,
): Map<string, Vector3> {
  const positions = new Map<string, Vector3>();
  const rng = mulberry32(seed);

  starIds.forEach((id, i) => {
    const { x, z } = vogelSpiralPoint(i, galaxyRadius * 0.6);
    const yJitter = (rng() - 0.5) * galaxyRadius * 0.15;
    positions.set(id, {
      x: galaxyCenter.x + x,
      y: galaxyCenter.y + yJitter,
      z: galaxyCenter.z + z,
    });
  });

  return positions;
}
