import { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { VisualNode } from '@music-cosmos/layout-engine';

const STAR_BASE_SCALE = 1;
const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

interface InstancedStarsProps {
  nodes: VisualNode[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
}

export function InstancedStars({ nodes, selectedId, hoveredId, onSelect, onHover }: InstancedStarsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const nodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  useLayoutEffect(() => {
    if (!meshRef.current || nodes.length === 0) return;
    nodes.forEach((node, i) => {
      dummy.position.set(node.position.x, node.position.y, node.position.z);
      const isHighlighted = node.id === selectedId || node.id === hoveredId;
      dummy.scale.setScalar(node.visualProps.size * STAR_BASE_SCALE * (isHighlighted ? 1.5 : 1));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      const brightness = node.visualProps.brightness * (isHighlighted ? 1.3 : 1);
      tempColor.setRGB(
        node.visualProps.color[0] * brightness,
        node.visualProps.color[1] * brightness,
        node.visualProps.color[2] * brightness,
      );
      meshRef.current.setColorAt(i, tempColor);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [nodes, selectedId, hoveredId]);

  if (nodes.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, nodes.length]}
      onClick={(e) => {
        e.stopPropagation();
        const id = nodeIds[e.instanceId ?? -1];
        if (id) onSelect(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        const id = nodeIds[e.instanceId ?? -1];
        if (id) onHover(id);
      }}
      onPointerOut={() => onHover(null)}
    >
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}
