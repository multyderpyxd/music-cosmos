import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { VisualNode } from '@music-cosmos/layout-engine';
import { mulberry32 } from '@music-cosmos/layout-engine';

interface GalaxyObjectProps {
  node: VisualNode;
  onClick?: () => void;
  isSelected?: boolean;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function GalaxyObject({ node, onClick, isSelected }: GalaxyObjectProps) {
  const { position, visualProps, domainId } = node;
  const diskRef = useRef<THREE.Points>(null!);

  const pointCount = Math.max(200, Math.min(1200, Math.floor(visualProps.size * 3)));
  const radius = visualProps.size * 0.35;

  const { positions, colors } = useMemo(() => {
    const rng = mulberry32(hashStr(domainId));
    const pos = new Float32Array(pointCount * 3);
    const col = new Float32Array(pointCount * 3);
    const baseColor = new THREE.Color(
      visualProps.color[0],
      visualProps.color[1],
      visualProps.color[2],
    );

    for (let i = 0; i < pointCount; i++) {
      const r = Math.pow(rng(), 0.5) * radius;
      const theta = rng() * Math.PI * 2;
      const ySpread = radius * 0.04;
      pos[i * 3]     = r * Math.cos(theta);
      pos[i * 3 + 1] = (rng() - 0.5) * ySpread;
      pos[i * 3 + 2] = r * Math.sin(theta);

      const brightness = 0.3 + rng() * 0.7;
      col[i * 3]     = baseColor.r * brightness;
      col[i * 3 + 1] = baseColor.g * brightness;
      col[i * 3 + 2] = baseColor.b * brightness;
    }
    return { positions: pos, colors: col };
  }, [domainId, pointCount, radius, visualProps.color]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <group position={[position.x, position.y, position.z]}>
      <points ref={diskRef} geometry={geometry}>
        <pointsMaterial
          vertexColors
          size={isSelected ? 2.5 : 1.8}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>

      {/* Core glow sphere */}
      <mesh onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
        <sphereGeometry args={[radius * 0.08, 8, 8]} />
        <meshBasicMaterial
          color={new THREE.Color(visualProps.color[0], visualProps.color[1], visualProps.color[2])}
          transparent
          opacity={isSelected ? 1 : 0.7}
        />
      </mesh>

      {/* Label plane for large zoom — invisible hitbox */}
      <mesh onClick={(e) => { e.stopPropagation(); onClick?.(); }} visible={false}>
        <planeGeometry args={[radius * 1.2, radius * 0.8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
