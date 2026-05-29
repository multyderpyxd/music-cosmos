import { useLayoutEffect, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { VisualNode } from '@music-cosmos/layout-engine';

interface InstancedSatellitesProps {
  nodes: VisualNode[];
  parentPositions: Map<string, readonly [number, number, number]>;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
}

export function InstancedSatellites({
  nodes,
  parentPositions,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: InstancedSatellitesProps) {
  const nodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  const mesh = useMemo(() => {
    if (nodes.length === 0) return null;
    const geo = new THREE.SphereGeometry(1, 7, 7);
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    const m = new THREE.InstancedMesh(geo, mat, nodes.length);
    m.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(nodes.length * 3).fill(0.9),
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
      const b = node.visualProps.brightness * (hi ? 1.5 : 1);
      c.setRGB(
        node.visualProps.color[0] * b,
        node.visualProps.color[1] * b,
        node.visualProps.color[2] * b,
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
      const r = node.visualProps.orbitRadius ?? 1.5;
      const phase = node.visualProps.orbitPhase ?? 0;
      const speed = node.visualProps.orbitSpeed ?? 1;
      const hi = node.id === selectedId || node.id === hoveredId;
      d.position.set(
        px + r * Math.cos(phase + t * speed),
        py + r * 0.12 * Math.sin(phase * 2 + t * speed * 0.7),
        pz + r * Math.sin(phase + t * speed),
      );
      d.scale.setScalar(node.visualProps.size * (hi ? 2.2 : 1));
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
