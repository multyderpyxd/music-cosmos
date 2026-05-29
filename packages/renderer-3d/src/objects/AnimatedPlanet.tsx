import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { VisualNode } from '@music-cosmos/layout-engine';

interface AnimatedPlanetProps {
  node: VisualNode;
  starPosition: readonly [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  isPaused: boolean;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onLivePosition?: (pos: THREE.Vector3) => void;
}

const _tmp = new THREE.Vector3();

export function AnimatedPlanet({
  node,
  starPosition,
  isSelected,
  isHovered,
  isPaused,
  onSelect,
  onHover,
  onLivePosition,
}: AnimatedPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const frozenT = useRef<number | null>(null);

  const color = useMemo(
    () => new THREE.Color(node.visualProps.color[0], node.visualProps.color[1], node.visualProps.color[2]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.visualProps.color[0], node.visualProps.color[1], node.visualProps.color[2]],
  );

  const r     = node.visualProps.orbitRadius ?? 10;
  const phase = node.visualProps.orbitPhase  ?? 0;
  const speed = node.visualProps.orbitSpeed  ?? 0.1;
  const size  = node.visualProps.size * ((isSelected || isHovered) ? 1.8 : 1);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (isPaused) {
      // Freeze: record the time at which we paused and hold position
      if (frozenT.current === null) frozenT.current = clock.elapsedTime;
    } else {
      frozenT.current = null;
    }
    const t = frozenT.current ?? clock.elapsedTime;
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
      <sphereGeometry args={[size, 14, 14]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.15}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
}
