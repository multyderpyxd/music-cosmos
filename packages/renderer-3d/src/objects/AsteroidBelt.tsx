import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { mulberry32 } from '@music-cosmos/layout-engine';

interface AsteroidBeltProps {
  parentPosition: readonly [number, number, number];
  orbitRadius: number;
  seed: number;
  count?: number;
  isPaused?: boolean;
}

export function AsteroidBelt({ parentPosition, orbitRadius, seed, count = 60, isPaused = false }: AsteroidBeltProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const params = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: count }, () => ({
      phase: rng() * Math.PI * 2,
      speed: 0.08 + rng() * 0.12,
      rOffset: (rng() - 0.5) * orbitRadius * 0.3,
      yOffset: (rng() - 0.5) * 0.5,
      size: 0.05 + rng() * 0.12,
    }));
  }, [seed, count, orbitRadius]);

  const frozenT = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (isPaused) {
      if (frozenT.current === null) frozenT.current = clock.elapsedTime;
    } else {
      frozenT.current = null;
    }
    const t = frozenT.current ?? clock.elapsedTime;
    params.forEach((p, i) => {
      const r = orbitRadius + p.rOffset;
      dummy.position.set(
        parentPosition[0] + r * Math.cos(p.phase + t * p.speed),
        parentPosition[1] + p.yOffset,
        parentPosition[2] + r * Math.sin(p.phase + t * p.speed),
      );
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#9a9a8a" roughness={0.9} metalness={0.1} />
    </instancedMesh>
  );
}
