import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { VisualNode } from '@music-cosmos/layout-engine';
import { createPlanetTexture } from '../textures/planetTexture.js';

interface AnimatedPlanetProps {
  node: VisualNode;
  starPosition: readonly [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  isPaused: boolean;
  dimmed: boolean;
  albumImageUrl?: string;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onLivePosition?: (pos: THREE.Vector3) => void;
}

const _tmp = new THREE.Vector3();

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function AnimatedPlanet({
  node,
  starPosition,
  isSelected,
  isHovered,
  isPaused,
  dimmed,
  albumImageUrl,
  onSelect,
  onHover,
  onLivePosition,
}: AnimatedPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const accTime = useRef(0);
  const speedScale = useRef(1);
  const prevClock = useRef<number | null>(null);

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const textureSeed = useMemo(() => hashStr(node.domainId), [node.domainId]);

  useEffect(() => {
    let cancelled = false;
    void createPlanetTexture(albumImageUrl, node.visualProps.color, textureSeed).then((tex) => {
      if (!cancelled) setTexture(tex);
    });
    return () => { cancelled = true; };
  }, [albumImageUrl, node.visualProps.color, textureSeed]);

  const r     = node.visualProps.orbitRadius ?? 10;
  const phase = node.visualProps.orbitPhase  ?? 0;
  const speed = node.visualProps.orbitSpeed  ?? 0.1;
  const size  = node.visualProps.size * (isHovered && !isSelected ? 1.4 : 1);
  const opacity = dimmed ? 0.14 : 1;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const elapsed = clock.elapsedTime;
    const dt = prevClock.current !== null ? elapsed - prevClock.current : 0;
    prevClock.current = elapsed;
    speedScale.current = THREE.MathUtils.lerp(speedScale.current, isPaused ? 0 : 1, 0.07);
    accTime.current += dt * speedScale.current;
    const t = accTime.current;
    const x = starPosition[0] + r * Math.cos(phase + t * speed);
    const y = starPosition[1];
    const z = starPosition[2] + r * Math.sin(phase + t * speed);
    meshRef.current.position.set(x, y, z);
    if (onLivePosition) onLivePosition(_tmp.set(x, y, z));
  });

  return (
    <mesh
      ref={meshRef}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(node.id); }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(node.id); }}
      onPointerOut={() => onHover(null)}
    >
      <sphereGeometry args={[size, 32, 32]} />
      {texture ? (
        <meshStandardMaterial
          map={texture}
          roughness={0.65}
          metalness={0.05}
          transparent={dimmed}
          opacity={opacity}
        />
      ) : (
        <meshStandardMaterial
          color={new THREE.Color(node.visualProps.color[0], node.visualProps.color[1], node.visualProps.color[2])}
          emissive={new THREE.Color(node.visualProps.color[0], node.visualProps.color[1], node.visualProps.color[2])}
          emissiveIntensity={0.1}
          roughness={0.65}
          transparent={dimmed}
          opacity={opacity}
        />
      )}
    </mesh>
  );
}
