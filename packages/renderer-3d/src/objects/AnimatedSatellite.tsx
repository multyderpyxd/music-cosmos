import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { VisualNode } from '@music-cosmos/layout-engine';

interface AnimatedSatelliteProps {
  node: VisualNode;
  // Parent planet orbital params (needed to track the planet's live position)
  planetOrbitRadius: number;
  planetOrbitPhase: number;
  planetOrbitSpeed: number;
  // Grandparent star position (static)
  starPosition: readonly [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onLivePosition?: (pos: THREE.Vector3) => void;
}

const _tmp = new THREE.Vector3();

export function AnimatedSatellite({
  node,
  planetOrbitRadius,
  planetOrbitPhase,
  planetOrbitSpeed,
  starPosition,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLivePosition,
}: AnimatedSatelliteProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  const color = useMemo(
    () => new THREE.Color(
      node.visualProps.color[0],
      node.visualProps.color[1],
      node.visualProps.color[2],
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.visualProps.color[0], node.visualProps.color[1], node.visualProps.color[2]],
  );

  const r     = node.visualProps.orbitRadius ?? 1.5;
  const phase = node.visualProps.orbitPhase  ?? 0;
  const speed = node.visualProps.orbitSpeed  ?? 1;
  const size  = node.visualProps.size * ((isSelected || isHovered) ? 2.5 : 1);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    // Recompute parent planet's live position every frame
    const px = starPosition[0] + planetOrbitRadius * Math.cos(planetOrbitPhase + t * planetOrbitSpeed);
    const py = starPosition[1];
    const pz = starPosition[2] + planetOrbitRadius * Math.sin(planetOrbitPhase + t * planetOrbitSpeed);

    // Satellite orbits around the planet's live position
    const x = px + r * Math.cos(phase + t * speed);
    const y = py + r * 0.15 * Math.sin(phase * 2 + t * speed * 0.7);
    const z = pz + r * Math.sin(phase + t * speed);
    meshRef.current.position.set(x, y, z);
    if (onLivePosition) onLivePosition(_tmp.set(x, y, z));
  });

  const brightness = Math.max(0.6, node.visualProps.brightness);

  return (
    <mesh
      ref={meshRef}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(node.id); }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(node.id); }}
      onPointerOut={() => onHover(null)}
    >
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial
        color={new THREE.Color(
          node.visualProps.color[0] * brightness,
          node.visualProps.color[1] * brightness,
          node.visualProps.color[2] * brightness,
        )}
      />
    </mesh>
  );
}
