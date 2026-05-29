import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CosmosCameraProps {
  targetPosition?: readonly [number, number, number];
  lookAtPosition?: readonly [number, number, number];
  isTrackingEntity?: boolean;
  trackingDistance?: number;
  trackedPositionRef?: React.MutableRefObject<THREE.Vector3 | null>;
  resetKey?: number;
  onCameraFree?: () => void;
}

const _delta = new THREE.Vector3();

export function CosmosCamera({
  targetPosition,
  lookAtPosition,
  isTrackingEntity,
  trackingDistance = 12,
  trackedPositionRef,
  resetKey,
  onCameraFree,
}: CosmosCameraProps) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const animating = useRef(false);
  const userInteracted = useRef(false);
  const targetCam = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const prevKey = useRef('');
  const wasTracking = useRef(false);
  const prevTrackedPos = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, 200, 800);
    camera.lookAt(0, 0, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to universe view when resetKey increments
  useEffect(() => {
    if (resetKey === undefined) return;
    userInteracted.current = false;
    animating.current = true;
    wasTracking.current = false;
    targetCam.current.set(0, 200, 800);
    targetLook.current.set(0, 0, 0);
    prevKey.current = '';
  }, [resetKey]);

  // Animate to fixed target (stars, galaxies)
  useEffect(() => {
    if (!targetPosition) return;
    const key = targetPosition.join(',');
    if (key === prevKey.current) return;
    prevKey.current = key;
    userInteracted.current = false;
    animating.current = true;
    targetCam.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
    if (lookAtPosition) targetLook.current.set(lookAtPosition[0], lookAtPosition[1], lookAtPosition[2]);
  }, [targetPosition, lookAtPosition]);

  useFrame(() => {
    const controls = controlsRef.current;

    // === TRACKING MODE ===
    if (isTrackingEntity && trackedPositionRef?.current) {
      const tracked = trackedPositionRef.current;
      if (!wasTracking.current) {
        const dist = camera.position.distanceTo(tracked);
        if (dist > trackingDistance * 3) {
          const d = trackingDistance;
          camera.position.set(tracked.x + d * 0.7, tracked.y + d * 0.5, tracked.z + d * 0.7);
        }
        prevTrackedPos.current.copy(tracked);
        wasTracking.current = true;
        controls?.target.copy(tracked);
        return;
      }
      _delta.subVectors(tracked, prevTrackedPos.current);
      prevTrackedPos.current.copy(tracked);
      camera.position.add(_delta);
      controls?.target.add(_delta);
      return;
    }

    wasTracking.current = false;

    // === NORMAL ANIMATION MODE ===
    if (!animating.current || userInteracted.current) return;
    camera.position.lerp(targetCam.current, 0.04);
    if (controls) controls.target.lerp(targetLook.current, 0.04);
    if (camera.position.distanceTo(targetCam.current) < 0.5) animating.current = false;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={0.3}
      maxDistance={3000}
      makeDefault
      onStart={() => {
        if (isTrackingEntity) return; // tracking: orbit around body, don't release
        userInteracted.current = true;
        animating.current = false;
        onCameraFree?.();
      }}
    />
  );
}
