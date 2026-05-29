import { useLayoutEffect, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { VisualNode } from '@music-cosmos/layout-engine';

interface InstancedStarsProps {
  nodes: VisualNode[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
}

export function InstancedStars({ nodes, selectedId, hoveredId, onSelect, onHover }: InstancedStarsProps) {
  const nodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  const mesh = useMemo(() => {
    if (nodes.length === 0) return null;
    const geo = new THREE.SphereGeometry(1, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    const m = new THREE.InstancedMesh(geo, mat, nodes.length);
    // Pre-init instanceColor so THREE compiles shader with USE_INSTANCING_COLOR from frame 1
    m.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(nodes.length * 3).fill(1.0),
      3,
    );
    return m;
  }, [nodes.length]);

  useEffect(() => {
    return () => {
      mesh?.geometry.dispose();
      if (mesh) (mesh.material as THREE.Material).dispose();
    };
  }, [mesh]);

  useLayoutEffect(() => {
    if (!mesh || nodes.length === 0) return;
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    nodes.forEach((node, i) => {
      const hi = node.id === selectedId || node.id === hoveredId;
      d.position.set(node.position.x, node.position.y, node.position.z);
      d.scale.setScalar(node.visualProps.size * (hi ? 1.8 : 1));
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      const b = Math.min(1, node.visualProps.brightness * (hi ? 1.4 : 1));
      c.setRGB(
        node.visualProps.color[0] * b,
        node.visualProps.color[1] * b,
        node.visualProps.color[2] * b,
      );
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [mesh, nodes, selectedId, hoveredId]);

  if (!mesh) return null;

  return (
    <primitive
      object={mesh}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const id = nodeIds[e.instanceId ?? -1];
        if (id) onSelect(id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        const id = nodeIds[e.instanceId ?? -1];
        if (id) onHover(id);
      }}
      onPointerOut={() => onHover(null)}
    />
  );
}
