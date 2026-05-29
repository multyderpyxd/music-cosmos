import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CosmosCameraProps {
  targetPosition?: readonly [number, number, number];
  onViewChange?: (distance: number) => void;
}

export function CosmosCamera({ targetPosition, onViewChange }: CosmosCameraProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const animating = useRef(false);
  const targetVec = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, 200, 800);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    if (!targetPosition) return;
    animating.current = true;
    targetVec.current.set(
      targetPosition[0] + 80,
      targetPosition[1] + 40,
      targetPosition[2] + 80,
    );
    targetLook.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
  }, [targetPosition]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(targetVec.current, 0.05);
    if (controlsRef.current) {
      const look = controlsRef.current.target;
      look.lerp(targetLook.current, 0.05);
    }
    if (camera.position.distanceTo(targetVec.current) < 0.5) {
      animating.current = false;
    }

    if (onViewChange) {
      onViewChange(camera.position.length());
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={2000}
      makeDefault
    />
  );
}
