import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
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
  onSelect,
  onHover,
  onBackground,
  onCameraFree,
}: CosmosCanvasProps) {
  // Animated objects write their live position here each frame; camera reads it
  const trackedPositionRef = useRef<THREE.Vector3 | null>(null);

  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 5000 }}
      gl={{ antialias: true, alpha: false }}
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
        trackedPositionRef={trackedPositionRef}
        onCameraFree={onCameraFree}
      />

      <CosmosScene
        scene={scene}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        trackedPositionRef={trackedPositionRef}
      />
    </Canvas>
  );
}
