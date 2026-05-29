import { useMemo } from 'react';
import type { VisualScene, VisualNode } from '@music-cosmos/layout-engine';
import { GalaxyObject } from '../objects/GalaxyObject.js';
import { InstancedStars } from '../instancing/InstancedStars.js';
import { InstancedPlanets } from '../instancing/InstancedPlanets.js';
import { InstancedSatellites } from '../instancing/InstancedSatellites.js';
import { AsteroidBelt } from '../objects/AsteroidBelt.js';

interface CosmosSceneProps {
  scene: VisualScene;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
}

export function CosmosScene({ scene, selectedId, hoveredId, onSelect, onHover }: CosmosSceneProps) {
  const { galaxies, stars, planets, satellites, asteroidBelts } = useMemo(() => {
    const galaxies: VisualNode[] = [];
    const stars: VisualNode[] = [];
    const planets: VisualNode[] = [];
    const satellites: VisualNode[] = [];
    const asteroidBelts: VisualNode[] = [];

    for (const node of scene.nodes) {
      switch (node.entityType) {
        case 'galaxy':       galaxies.push(node); break;
        case 'star':         stars.push(node);    break;
        case 'planet':       planets.push(node);  break;
        case 'satellite':    satellites.push(node); break;
        case 'asteroid-belt': asteroidBelts.push(node); break;
      }
    }
    return { galaxies, stars, planets, satellites, asteroidBelts };
  }, [scene]);

  // Position lookup map for orbital animation: nodeId → [x,y,z]
  const positionMap = useMemo(() => {
    const m = new Map<string, readonly [number, number, number]>();
    for (const node of scene.nodes) {
      m.set(node.id, [node.position.x, node.position.y, node.position.z]);
    }
    return m;
  }, [scene]);

  return (
    <>
      {/* Ambient star field background */}
      <StarField count={2000} radius={1500} />

      {/* Galaxies */}
      {galaxies.map((node) => (
        <GalaxyObject
          key={node.id}
          node={node}
          isSelected={node.id === selectedId}
          onClick={() => onSelect(node.id)}
        />
      ))}

      {/* Stars (artists) — InstancedMesh */}
      <InstancedStars
        nodes={stars}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
      />

      {/* Planets (albums) — InstancedMesh with orbital animation */}
      <InstancedPlanets
        nodes={planets}
        parentPositions={positionMap}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
      />

      {/* Satellites (tracks) — InstancedMesh with orbital animation */}
      <InstancedSatellites
        nodes={satellites}
        parentPositions={positionMap}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
      />

      {/* Asteroid belts for hidden tracks */}
      {asteroidBelts.map((node) => {
        const parentPos = node.parentId ? positionMap.get(node.parentId) : undefined;
        const pos: readonly [number, number, number] = parentPos ?? [node.position.x, node.position.y, node.position.z];
        return (
          <AsteroidBelt
            key={node.id}
            parentPosition={pos}
            orbitRadius={(node.visualProps.orbitRadius ?? 4) + 2}
            seed={hashStr(node.id)}
            count={Math.min(80, (node.metadata['hiddenCount'] as number | undefined ?? 20))}
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

// Simple background star field — static points
import { useRef } from 'react';
import * as THREE from 'three';

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

  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.8} sizeAttenuation transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}
