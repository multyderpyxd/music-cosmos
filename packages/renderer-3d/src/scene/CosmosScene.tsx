import { useMemo, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { VisualScene, VisualNode } from '@music-cosmos/layout-engine';
import { GalaxyObject } from '../objects/GalaxyObject.js';
import { StarPoints } from '../objects/StarPoints.js';
import { AnimatedPlanet } from '../objects/AnimatedPlanet.js';
import { AnimatedSatellite } from '../objects/AnimatedSatellite.js';
import { AsteroidBelt } from '../objects/AsteroidBelt.js';

interface CosmosSceneProps {
  scene: VisualScene;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  trackedPositionRef?: React.MutableRefObject<THREE.Vector3 | null>;
}

export function CosmosScene({ scene, selectedId, hoveredId, onSelect, onHover, trackedPositionRef }: CosmosSceneProps) {
  const { galaxies, stars, planets, satellites, asteroidBelts } = useMemo(() => {
    const galaxies: VisualNode[] = [];
    const stars: VisualNode[] = [];
    const planets: VisualNode[] = [];
    const satellites: VisualNode[] = [];
    const asteroidBelts: VisualNode[] = [];
    for (const node of scene.nodes) {
      switch (node.entityType) {
        case 'galaxy':        galaxies.push(node); break;
        case 'star':          stars.push(node);    break;
        case 'planet':        planets.push(node);  break;
        case 'satellite':     satellites.push(node); break;
        case 'asteroid-belt': asteroidBelts.push(node); break;
      }
    }
    return { galaxies, stars, planets, satellites, asteroidBelts };
  }, [scene]);

  const positionMap = useMemo(() => {
    const m = new Map<string, readonly [number, number, number]>();
    for (const node of scene.nodes) {
      m.set(node.id, [node.position.x, node.position.y, node.position.z]);
    }
    return m;
  }, [scene]);

  const nodeById = useMemo(() => new Map(scene.nodes.map((n) => [n.id, n])), [scene]);

  const handleLivePosition = useCallback((pos: THREE.Vector3) => {
    if (trackedPositionRef) trackedPositionRef.current = pos;
  }, [trackedPositionRef]);

  return (
    <>
      <StarField count={2000} radius={1500} />

      {galaxies.map((node) => (
        <GalaxyObject
          key={node.id}
          node={node}
          isSelected={node.id === selectedId}
          onClick={() => onSelect(node.id)}
        />
      ))}

      <StarPoints
        nodes={stars}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
      />

      {planets.map((node) => {
        const starPos = node.parentId ? positionMap.get(node.parentId) : undefined;
        const sp: readonly [number, number, number] = starPos ?? [node.position.x, node.position.y, node.position.z];
        const isSelected = node.id === selectedId;
        return (
          <AnimatedPlanet
            key={node.id}
            node={node}
            starPosition={sp}
            isSelected={isSelected}
            isHovered={node.id === hoveredId}
            onSelect={onSelect}
            onHover={onHover}
            onLivePosition={isSelected ? handleLivePosition : undefined}
          />
        );
      })}

      {satellites.map((node) => {
        const parentPlanet = node.parentId ? nodeById.get(node.parentId) : undefined;
        const grandparentStar = parentPlanet?.parentId ? nodeById.get(parentPlanet.parentId) : undefined;
        const starPos = grandparentStar
          ? [grandparentStar.position.x, grandparentStar.position.y, grandparentStar.position.z] as const
          : [node.position.x, node.position.y, node.position.z] as const;
        const isSelected = node.id === selectedId;
        return (
          <AnimatedSatellite
            key={node.id}
            node={node}
            planetOrbitRadius={parentPlanet?.visualProps.orbitRadius ?? 10}
            planetOrbitPhase={parentPlanet?.visualProps.orbitPhase ?? 0}
            planetOrbitSpeed={parentPlanet?.visualProps.orbitSpeed ?? 0.1}
            starPosition={starPos}
            isSelected={isSelected}
            isHovered={node.id === hoveredId}
            onSelect={onSelect}
            onHover={onHover}
            onLivePosition={isSelected ? handleLivePosition : undefined}
          />
        );
      })}

      {asteroidBelts.map((node) => {
        const parentPlanet = node.parentId ? nodeById.get(node.parentId) : undefined;
        const grandparentStar = parentPlanet?.parentId ? nodeById.get(parentPlanet.parentId) : undefined;
        const starPos = grandparentStar
          ? [grandparentStar.position.x, grandparentStar.position.y, grandparentStar.position.z] as const
          : [node.position.x, node.position.y, node.position.z] as const;
        return (
          <AsteroidBelt
            key={node.id}
            parentPosition={starPos}
            orbitRadius={(parentPlanet?.visualProps.orbitRadius ?? 10) + (node.visualProps.orbitRadius ?? 3)}
            seed={hashStr(node.id)}
            count={Math.min(60, (node.metadata['hiddenCount'] as number | undefined) ?? 20)}
          />
        );
      })}
    </>
  );
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function StarField({ count, radius }: { count: number; radius: number }) {
  const geo = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.5 + Math.random() * 0.5);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count, radius]);

  const matRef = useRef<THREE.PointsMaterial>(null!);

  return (
    <points geometry={geo}>
      <pointsMaterial ref={matRef} color="#ffffff" size={0.8} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}
