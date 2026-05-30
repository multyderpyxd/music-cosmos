import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { VisualScene } from '@music-cosmos/layout-engine';
import { CosmosScene } from './CosmosScene.js';
import { CosmosCamera } from '../camera/CosmosCamera.js';

interface CosmosCanvasProps {
  scene: VisualScene;
  selectedId: string | null;
  hoveredId: string | null;
  cameraTarget?: readonly [number, number, number];
  cameraLookAt?: readonly [number, number, number];
  isTrackingEntity?: boolean;
  trackingDistance?: number;
  isPaused?: boolean;
  activeEntityTypes: Set<string>;
  galaxyParticleOpacity: number;
  albumImages?: Map<string, string>;
  resetCameraKey?: number;
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onBackground?: () => void;
  onCameraFree?: () => void;
}

export function CosmosCanvas({
  scene,
  selectedId,
  hoveredId,
  cameraTarget,
  cameraLookAt,
  isTrackingEntity,
  trackingDistance,
  isPaused = false,
  activeEntityTypes,
  galaxyParticleOpacity,
  albumImages,
  resetCameraKey,
  onSelect,
  onHover,
  onBackground,
  onCameraFree,
}: CosmosCanvasProps) {
  const trackedPositionRef = useRef<THREE.Vector3 | null>(null);

  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 5000 }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      style={{ background: '#020210' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackground?.();
      }}
    >
      <color attach="background" args={['#020210']} />
      <fog attach="fog" args={['#020210', 1200, 4000]} />

      <ambientLight intensity={0.4} />
      <pointLight position={[0, 500, 0]} intensity={1.5} color="#ffffff" />
      <pointLight position={[200, -100, 300]} intensity={0.6} color="#6B48FF" />

      <CosmosCamera
        targetPosition={cameraTarget}
        lookAtPosition={cameraLookAt}
        isTrackingEntity={isTrackingEntity}
        trackingDistance={trackingDistance}
        trackedPositionRef={trackedPositionRef}
        resetKey={resetCameraKey}
        onCameraFree={onCameraFree}
      />

      <CosmosScene
        scene={scene}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        trackedPositionRef={trackedPositionRef}
        isPaused={isPaused}
        activeEntityTypes={activeEntityTypes}
        galaxyParticleOpacity={galaxyParticleOpacity}
        albumImages={albumImages}
      />

      {/* Bloom — stars/galaxy cores output HDR values (>1) so this triggers */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.4}
          intensity={1.8}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
