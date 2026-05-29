import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CosmosCameraProps {
  // Position the camera should animate to (already computed with offset from entity)
  targetPosition?: readonly [number, number, number];
  // Entity world position to look at
  lookAtPosition?: readonly [number, number, number];
}

export function CosmosCamera({ targetPosition, lookAtPosition }: CosmosCameraProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const animating = useRef(false);
  const userInteracted = useRef(false);
  const targetCam = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const prevKey = useRef('');

  useEffect(() => {
    camera.position.set(0, 200, 800);
    camera.lookAt(0, 0, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!targetPosition) return;
    const key = targetPosition.join(',');
    if (key === prevKey.current) return; // same target, ignore
    prevKey.current = key;
    userInteracted.current = false;
    animating.current = true;
    targetCam.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
    if (lookAtPosition) {
      targetLook.current.set(lookAtPosition[0], lookAtPosition[1], lookAtPosition[2]);
    }
  }, [targetPosition, lookAtPosition]);

  useFrame(() => {
    if (!animating.current || userInteracted.current) return;
    camera.position.lerp(targetCam.current, 0.04);
    if (controlsRef.current && lookAtPosition) {
      controlsRef.current.target.lerp(targetLook.current, 0.04);
    }
    if (camera.position.distanceTo(targetCam.current) < 0.5) {
      animating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={2}
      maxDistance={3000}
      makeDefault
      onStart={() => {
        // User touched the camera — stop animation, let them navigate freely
        userInteracted.current = true;
        animating.current = false;
      }}
    />
  );
}
