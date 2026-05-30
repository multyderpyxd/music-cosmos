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
  // selectedEntityType kept as prop for potential future use; bloom behaviour
  // no longer depends on it — stars always keep a soft bloom when dimmed.
  void selectedEntityType;

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

      // Dimmed stars are smaller so they don't visually compete with selection
      const sizeScale = isHovered ? 2.2 : isSelected ? 2.0 : (dimmed ? 0.85 : 1.4);
      sizes[i] = node.visualProps.size * sizeScale;

      // dimFactor = 0.38 for ALL dimmed states.
      // Result: 0.6 * 0.38 * 3.5 ≈ 0.80 → right at bloom threshold.
      // Stars visually dim (smaller + lower brightness) but keep a soft glow
      // regardless of whether a star, planet, satellite, or galaxy is selected.
      const dimFactor = dimmed ? 0.38 : 1;
      const base = Math.max(0.6, node.visualProps.brightness) *
                   (isHovered ? 1.4 : isSelected ? 1.2 : 1) *
                   dimFactor;

      // HDR always ×3.5 → bloom fires whenever luminance > 0.8
      // dimmed:  0.6 * 0.38 * 3.5 ≈ 0.80  → soft bloom ✓
      // normal:  0.6 * 1.00 * 3.5 ≈ 2.10  → strong bloom ✓
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
  }, [nodes, selectedId, hoveredId, hasSelection]);

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
