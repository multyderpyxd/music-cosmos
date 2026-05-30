import { useMemo } from 'react';
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

const TWO_PI = Math.PI * 2;

export function GalaxyObject({ node, onClick, particleOpacity = 0.55, dimmed = false }: GalaxyObjectProps) {
  const { position, visualProps, domainId } = node;
  const radius = visualProps.size * 0.35;

  // --- Spiral arm particle geometry ---
  const geometry = useMemo(() => {
    const rng = mulberry32(hashStr(domainId));
    const total = Math.max(300, Math.min(1400, Math.floor(visualProps.size * 4)));
    const ARM_COUNT   = 2;                              // 2-arm barred spiral
    const bulgeCount  = Math.floor(total * 0.18);       // dense central bulge
    const armTotal    = total - bulgeCount;
    const perArm      = Math.floor(armTotal / ARM_COUNT);

    const positions = new Float32Array(total * 3);
    const colors    = new Float32Array(total * 3);
    const base = new THREE.Color(visualProps.color[0], visualProps.color[1], visualProps.color[2]);
    let idx = 0;

    // ── Spiral arms ──
    for (let arm = 0; arm < ARM_COUNT; arm++) {
      const armOffset = (arm / ARM_COUNT) * TWO_PI;

      for (let p = 0; p < perArm; p++) {
        const t = rng();                            // 0 = center, 1 = outer edge
        const r = Math.pow(t, 0.55) * radius;      // concentrated near center
        const theta = armOffset + t * Math.PI * 2.6 + (rng() - 0.5) * 0.5;

        // Arm width grows toward outer edge
        const width = radius * (0.04 + t * 0.22);
        const tangentAngle = theta + Math.PI * 0.5;
        const scatter = (rng() - 0.5) * width;

        positions[idx * 3]     = r * Math.cos(theta) + scatter * Math.cos(tangentAngle);
        positions[idx * 3 + 1] = (rng() - 0.5) * radius * 0.035;
        positions[idx * 3 + 2] = r * Math.sin(theta) + scatter * Math.sin(tangentAngle);

        // Brighter near center, dimmer at edge
        const bright = 0.2 + (1 - t) * 0.7 + rng() * 0.1;
        colors[idx * 3]     = base.r * bright;
        colors[idx * 3 + 1] = base.g * bright;
        colors[idx * 3 + 2] = base.b * bright;
        idx++;
      }
    }

    // ── Central bulge (spherical distribution, very concentrated) ──
    for (let p = 0; p < bulgeCount; p++) {
      const r    = Math.pow(rng(), 2.5) * radius * 0.22;
      const theta = rng() * TWO_PI;
      const phi   = (rng() - 0.5) * Math.PI;

      positions[idx * 3]     = r * Math.cos(theta) * Math.cos(phi);
      positions[idx * 3 + 1] = r * Math.sin(phi) * 0.45;
      positions[idx * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);

      // Bulge is warmer/brighter — mix color toward warm white
      const warmth = 0.6 + rng() * 0.5;
      colors[idx * 3]     = Math.min(1, base.r * warmth + 0.15);
      colors[idx * 3 + 1] = Math.min(1, base.g * warmth + 0.10);
      colors[idx * 3 + 2] = Math.min(1, base.b * warmth + 0.05);
      idx++;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [domainId, radius, visualProps.size, visualProps.color]);

  // Particles: dimmed → less visible but still present
  const effectiveOpacity = dimmed ? particleOpacity * 0.25 : particleOpacity;
  // Core: HDR ×2.5 when dimmed → color * 2.5 > 0.8 for most galaxy colors → keeps bloom.
  // HDR ×5 when normal → strong bloom nucleus.
  // No opacity reduction (transparent=false always) to avoid killing luminance in HDR buffer.
  const coreHdr = dimmed ? 2.5 : 5;

  return (
    <group position={[position.x, position.y, position.z]}>

      {/* Spiral arm + bulge particles — decorative, NOT clickable */}
      {particleOpacity > 0 && (
        <points geometry={geometry}>
          <pointsMaterial
            vertexColors
            size={1.6}
            sizeAttenuation
            transparent
            opacity={effectiveOpacity}
            depthWrite={false}
          />
        </points>
      )}

      {/* Galactic nucleus — tiny bright point (much smaller than a star visually)
          surrounded by the spiral disc. Fully opaque so it always blooms. */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerOver={(e) => e.stopPropagation()}
      >
        <sphereGeometry args={[radius * 0.035, 8, 8]} />
        <meshBasicMaterial
          color={new THREE.Color(
            visualProps.color[0] * coreHdr,
            visualProps.color[1] * coreHdr,
            visualProps.color[2] * coreHdr,
          )}
          toneMapped={false}
        />
      </mesh>

      {/* Larger invisible click area for easier interaction.
          opacity=0 + transparent=true = invisible but still raycasted. */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerOver={(e) => e.stopPropagation()}
      >
        <sphereGeometry args={[radius * 0.25, 6, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

    </group>
  );
}
