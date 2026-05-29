import { Canvas } from '@react-three/fiber';
import type { VisualScene } from '@music-cosmos/layout-engine';
import { CosmosScene } from './CosmosScene.js';
import { CosmosCamera } from '../camera/CosmosCamera.js';

interface CosmosCanvasProps {
  scene: VisualScene;
  selectedId: string | null;
  hoveredId: string | null;
  cameraTarget?: readonly [number, number, number];
  onSelect: (nodeId: string) => void;
  onHover: (nodeId: string | null) => void;
  onBackground?: () => void;
}

export function CosmosCanvas({
  scene,
  selectedId,
  hoveredId,
  cameraTarget,
  onSelect,
  onHover,
  onBackground,
}: CosmosCanvasProps) {
  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 5000 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#020210' }}
      onClick={(e) => {
        // Click on empty space → deselect
        if (e.target === e.currentTarget) onBackground?.();
      }}
    >
      <color attach="background" args={['#020210']} />
      <fog attach="fog" args={['#020210', 800, 2500]} />

      <ambientLight intensity={0.15} />
      <pointLight position={[0, 200, 0]} intensity={0.8} color="#ffffff" />

      <CosmosCamera targetPosition={cameraTarget} />

      <CosmosScene
        scene={scene}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
      />
    </Canvas>
  );
}
