import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { VisualNode } from '@music-cosmos/layout-engine';
import { mulberry32 } from '@music-cosmos/layout-engine';

interface GalaxyObjectProps {
  node: VisualNode;
  onClick?: () => void;
  isSelected?: boolean;
  particleOpacity?: number;
  dimmed?: boolean;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function GalaxyObject({ node, onClick, isSelected, particleOpacity = 0.55, dimmed = false }: GalaxyObjectProps) {
  const { position, visualProps, domainId } = node;
  const diskRef = useRef<THREE.Points>(null!);

  const pointCount = Math.max(200, Math.min(1200, Math.floor(visualProps.size * 3)));
  const radius = visualProps.size * 0.35;

  const { positions, colors } = useMemo(() => {
    const rng = mulberry32(hashStr(domainId));
    const pos = new Float32Array(pointCount * 3);
    const col = new Float32Array(pointCount * 3);
    const baseColor = new THREE.Color(visualProps.color[0], visualProps.color[1], visualProps.color[2]);

    for (let i = 0; i < pointCount; i++) {
      const r = Math.pow(rng(), 0.5) * radius;
      const theta = rng() * Math.PI * 2;
      pos[i * 3]     = r * Math.cos(theta);
      pos[i * 3 + 1] = (rng() - 0.5) * radius * 0.04;
      pos[i * 3 + 2] = r * Math.sin(theta);
      const b = 0.3 + rng() * 0.7;
      col[i * 3]     = baseColor.r * b;
      col[i * 3 + 1] = baseColor.g * b;
      col[i * 3 + 2] = baseColor.b * b;
    }
    return { positions: pos, colors: col };
  }, [domainId, pointCount, radius, visualProps.color]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  const effectiveOpacity = dimmed ? particleOpacity * 0.15 : particleOpacity;
  const coreOpacity = dimmed ? 0.2 : (isSelected ? 1 : 0.7);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Decorative nebula particles — NOT clickable (no event handlers) */}
      {particleOpacity > 0 && (
        <points ref={diskRef} geometry={geometry}>
          <pointsMaterial
            vertexColors
            size={isSelected ? 2.5 : 1.8}
            sizeAttenuation
            transparent
            opacity={effectiveOpacity}
            depthWrite={false}
          />
        </points>
      )}

      {/* Central core sphere — the ONLY clickable part of the galaxy */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerOver={(e) => e.stopPropagation()}
      >
        <sphereGeometry args={[radius * 0.12, 10, 10]} />
        <meshBasicMaterial
          color={new THREE.Color(visualProps.color[0], visualProps.color[1], visualProps.color[2])}
          transparent
          opacity={coreOpacity}
        />
      </mesh>
    </group>
  );
}
