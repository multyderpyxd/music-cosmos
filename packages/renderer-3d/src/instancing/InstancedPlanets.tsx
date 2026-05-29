import { useLayoutEffect, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { VisualNode } from '@music-cosmos/layout-engine';

interface InstancedPlanetsProps {
  nodes: VisualNode[];
  parentPositions: Map<string, readonly [number, number, number]>;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
}

export function InstancedPlanets({
  nodes,
  parentPositions,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: InstancedPlanetsProps) {
  const nodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  const mesh = useMemo(() => {
    if (nodes.length === 0) return null;
    const geo = new THREE.SphereGeometry(1, 14, 14);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.6,
      metalness: 0.1,
      toneMapped: false,
    });
    const m = new THREE.InstancedMesh(geo, mat, nodes.length);
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
    const c = new THREE.Color();
    nodes.forEach((node, i) => {
      const hi = node.id === selectedId || node.id === hoveredId;
      c.setRGB(
        node.visualProps.color[0] * (hi ? 1.4 : 1.0),
        node.visualProps.color[1] * (hi ? 1.4 : 1.0),
        node.visualProps.color[2] * (hi ? 1.4 : 1.2),
      );
      mesh.setColorAt(i, c);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [mesh, nodes, selectedId, hoveredId]);

  useFrame(({ clock }) => {
    if (!mesh || nodes.length === 0) return;
    const t = clock.elapsedTime;
    const d = new THREE.Object3D();
    nodes.forEach((node, i) => {
      const parent = node.parentId ? parentPositions.get(node.parentId) : undefined;
      const px = parent?.[0] ?? node.position.x;
      const py = parent?.[1] ?? node.position.y;
      const pz = parent?.[2] ?? node.position.z;
      const r = node.visualProps.orbitRadius ?? 10;
      const phase = node.visualProps.orbitPhase ?? 0;
      const speed = node.visualProps.orbitSpeed ?? 0.1;
      const hi = node.id === selectedId || node.id === hoveredId;
      d.position.set(
        px + r * Math.cos(phase + t * speed),
        py,
        pz + r * Math.sin(phase + t * speed),
      );
      d.scale.setScalar(node.visualProps.size * (hi ? 1.8 : 1));
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

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
