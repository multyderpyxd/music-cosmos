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
  dimmed: boolean;
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
  dimmed,
  onSelect,
  onHover,
  onLivePosition,
}: AnimatedPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const accTime = useRef(0);
  const speedScale = useRef(1);
  const prevClock = useRef<number | null>(null);

  const color = useMemo(
    () => new THREE.Color(node.visualProps.color[0], node.visualProps.color[1], node.visualProps.color[2]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.visualProps.color[0], node.visualProps.color[1], node.visualProps.color[2]],
  );

  const r     = node.visualProps.orbitRadius ?? 10;
  const phase = node.visualProps.orbitPhase  ?? 0;
  const speed = node.visualProps.orbitSpeed  ?? 0.1;
  // Hover enlarges; selecting returns to normal size
  const size  = node.visualProps.size * (isHovered && !isSelected ? 1.4 : 1);
  const opacity = dimmed ? 0.14 : 1;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const elapsed = clock.elapsedTime;
    const dt = prevClock.current !== null ? elapsed - prevClock.current : 0;
    prevClock.current = elapsed;
    // Smooth deceleration/acceleration: lerp speed scale toward 0 or 1
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
      <sphereGeometry args={[size, 14, 14]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.15}
        roughness={0.6}
        metalness={0.1}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}
