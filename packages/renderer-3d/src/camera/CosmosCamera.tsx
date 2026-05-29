import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CosmosCameraProps {
  targetPosition?: readonly [number, number, number];
  lookAtPosition?: readonly [number, number, number];
  isTrackingEntity?: boolean;
  trackedPositionRef?: React.MutableRefObject<THREE.Vector3 | null>;
  onCameraFree?: () => void;
}

const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _offset = new THREE.Vector3(10, 7, 10); // orbit offset for tracking mode

export function CosmosCamera({
  targetPosition,
  lookAtPosition,
  isTrackingEntity,
  trackedPositionRef,
  onCameraFree,
}: CosmosCameraProps) {
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

  // Animate to fixed target when star/galaxy is selected
  useEffect(() => {
    if (!targetPosition) return;
    const key = targetPosition.join(',');
    if (key === prevKey.current) return;
    prevKey.current = key;
    userInteracted.current = false;
    animating.current = true;
    targetCam.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
    if (lookAtPosition) {
      targetLook.current.set(lookAtPosition[0], lookAtPosition[1], lookAtPosition[2]);
    }
  }, [targetPosition, lookAtPosition]);

  // Clear tracked position when tracking mode turns off
  useEffect(() => {
    if (!isTrackingEntity && trackedPositionRef) {
      trackedPositionRef.current = null;
    }
    if (isTrackingEntity) {
      userInteracted.current = false;
    }
  }, [isTrackingEntity, trackedPositionRef]);

  useFrame(() => {
    const controls = controlsRef.current;

    // === Tracking mode: follow the orbiting planet/satellite ===
    if (isTrackingEntity && trackedPositionRef?.current && !userInteracted.current) {
      const tracked = trackedPositionRef.current;
      // Smooth-follow: lerp both the camera position and the orbit target
      _lookTarget.copy(tracked);
      _camTarget.copy(tracked).add(_offset);
      camera.position.lerp(_camTarget, 0.07);
      if (controls) controls.target.lerp(_lookTarget, 0.07);
      return;
    }

    // === Normal animation: lerp toward fixed target (star / galaxy focus) ===
    if (!animating.current || userInteracted.current) return;
    camera.position.lerp(targetCam.current, 0.04);
    if (controls && lookAtPosition) controls.target.lerp(targetLook.current, 0.04);
    if (camera.position.distanceTo(targetCam.current) < 0.5) animating.current = false;
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
        // User dragged — release lock
        userInteracted.current = true;
        animating.current = false;
        onCameraFree?.();
      }}
    />
  );
}
