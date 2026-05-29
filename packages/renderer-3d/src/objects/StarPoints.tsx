import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { VisualNode } from '@music-cosmos/layout-engine';

interface StarPointsProps {
  nodes: VisualNode[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
}

export function StarPoints({ nodes, selectedId, hoveredId, onSelect, onHover }: StarPointsProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const hasSelection = selectedId !== null;

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

      // Hover (not selected) enlarges; click returns to base size
      const sizeScale = isHovered ? 2.2 : isSelected ? 2.0 : 1.4;
      sizes[i] = node.visualProps.size * sizeScale;

      const b = Math.max(0.6, node.visualProps.brightness) *
                (isHovered ? 1.4 : isSelected ? 1.2 : 1) *
                (dimmed ? 0.15 : 1);
      colors[i * 3]     = Math.min(1, node.visualProps.color[0] * b);
      colors[i * 3 + 1] = Math.min(1, node.visualProps.color[1] * b);
      colors[i * 3 + 2] = Math.min(1, node.visualProps.color[2] * b);
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
      <pointsMaterial
        vertexColors
        sizeAttenuation
        size={2.5}
        toneMapped={false}
        transparent
        opacity={1}
      />
    </points>
  );
}
