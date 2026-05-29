import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { VisualNode } from '@music-cosmos/layout-engine';

const SAT_BASE_SCALE = 0.8;
const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

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
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const nodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  useLayoutEffect(() => {
    if (!meshRef.current || nodes.length === 0) return;
    nodes.forEach((node, i) => {
      const isHighlighted = node.id === selectedId || node.id === hoveredId;
      const b = node.visualProps.brightness * (isHighlighted ? 1.5 : 1);
      tempColor.setRGB(
        node.visualProps.color[0] * b,
        node.visualProps.color[1] * b,
        node.visualProps.color[2] * b,
      );
      meshRef.current.setColorAt(i, tempColor);
    });
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [nodes, selectedId, hoveredId]);

  useFrame(({ clock }) => {
    if (!meshRef.current || nodes.length === 0) return;
    const t = clock.elapsedTime;
    nodes.forEach((node, i) => {
      const parent = node.parentId ? parentPositions.get(node.parentId) : undefined;
      const px = parent?.[0] ?? node.position.x;
      const py = parent?.[1] ?? node.position.y;
      const pz = parent?.[2] ?? node.position.z;

      const r = node.visualProps.orbitRadius ?? 1.5;
      const phase = node.visualProps.orbitPhase ?? 0;
      const speed = node.visualProps.orbitSpeed ?? 1;
      const isHighlighted = node.id === selectedId || node.id === hoveredId;

      dummy.position.set(
        px + r * Math.cos(phase + t * speed),
        py + r * 0.1 * Math.sin(phase * 2 + t * speed * 0.7),
        pz + r * Math.sin(phase + t * speed),
      );
      dummy.scale.setScalar(
        node.visualProps.size * SAT_BASE_SCALE * (isHighlighted ? 2 : 1),
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

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
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}
