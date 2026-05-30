import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { VisualNode } from '@music-cosmos/layout-engine';

interface StarPointsProps {
  nodes: VisualNode[];
  selectedId: string | null;
  hoveredId: string | null;
  /** Entity type of the currently selected node — drives star bloom behaviour */
  selectedEntityType: string | null;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
}

export function StarPoints({ nodes, selectedId, hoveredId, selectedEntityType, onSelect, onHover }: StarPointsProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const hasSelection = selectedId !== null;
  // Stars lose bloom only when a NON-STAR entity is selected (planet/satellite/galaxy).
  // When another star is selected, background stars keep a soft bloom.
  const nonStarSelected = hasSelection && !!selectedEntityType && selectedEntityType !== 'star';

  const { geometry, nodeIds } = useMemo(() => {
    const nodeIds = nodes.map((n) => n.id);
    const positions = new Float32Array(nodes.length * 3);
    const colors    = new Float32Array(nodes.length * 3);
    const sizes     = new Float32Array(nodes.length);

    nodes.forEach((node, i) => {
      positions[i * 3]     = node.position.x;
      positions[i * 3 + 1] = node.position.y;
      positions[i * 3 + 2] = node.position.z;

      const isSelected = node.id === selectedId;
      const isHovered  = node.id === hoveredId && !isSelected;
      const dimmed     = hasSelection && !isSelected;

      const sizeScale = isHovered ? 2.2 : isSelected ? 2.0 : 1.4;
      sizes[i] = node.visualProps.size * sizeScale;

      // dimFactor controls how much a non-selected star dims:
      //   nonStarSelected → 0.12 (nearly invisible, no bloom)
      //   star selected   → 0.38 (soft glow, still blooms at hdr×3.5)
      const dimFactor = dimmed ? (nonStarSelected ? 0.12 : 0.38) : 1;
      const base = Math.max(0.6, node.visualProps.brightness) *
                   (isHovered ? 1.4 : isSelected ? 1.2 : 1) *
                   dimFactor;

      // Stars always get HDR multiplier — bloom fires in all cases where
      // effective value > luminance threshold (0.8).
      // When nonStarSelected: 0.6 * 0.12 * 3.5 ≈ 0.25  → below threshold, no bloom ✓
      // When starSelected:    0.6 * 0.38 * 3.5 ≈ 0.80  → at threshold, soft bloom ✓
      // Normal state:         0.6 * 1.0  * 3.5 ≈ 2.10  → strong bloom ✓
      const hdr = 3.5;
      colors[i * 3]     = node.visualProps.color[0] * base * hdr;
      colors[i * 3 + 1] = node.visualProps.color[1] * base * hdr;
      colors[i * 3 + 2] = node.visualProps.color[2] * base * hdr;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
    return { geometry: geo, nodeIds };
  }, [nodes, selectedId, hoveredId, hasSelection, nonStarSelected]);

  if (nodes.length === 0) return null;

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.index !== undefined) {
          const id = nodeIds[e.index];
          if (id) onSelect(id);
        }
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (e.index !== undefined) {
          const id = nodeIds[e.index];
          if (id) onHover(id);
        }
      }}
      onPointerOut={() => onHover(null)}
    >
      <pointsMaterial vertexColors sizeAttenuation size={2.5} toneMapped={false} transparent opacity={1} />
    </points>
  );
}
