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
  onCameraFree?: () => void;
}

// Reusable vectors — allocated once, never recreated per frame
const _delta = new THREE.Vector3();
const _prevTracked = new THREE.Vector3();

export function CosmosCamera({
  targetPosition,
  lookAtPosition,
  isTrackingEntity,
  trackingDistance = 12,
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
  const wasTracking = useRef(false);
  // Stores the tracked position from the PREVIOUS frame for delta computation
  const prevTrackedPos = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(0, 200, 800);
    camera.lookAt(0, 0, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate to fixed target for non-moving entities (stars, galaxies)
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
    // The orbiting body is the pivot. User can orbit/zoom freely around it.
    // Camera distance is fully controlled by the user (scroll wheel).
    // ONLY the Unfix button exits tracking — dragging does NOT release it.
    if (isTrackingEntity && trackedPositionRef?.current) {
      const tracked = trackedPositionRef.current;

      if (!wasTracking.current) {
        // First frame entering tracking mode:
        // If camera is far, snap it to a reasonable starting distance.
        const dist = camera.position.distanceTo(tracked);
        if (dist > trackingDistance * 3) {
          const d = trackingDistance;
          camera.position.set(
            tracked.x + d * 0.7,
            tracked.y + d * 0.5,
            tracked.z + d * 0.7,
          );
        }
        // Record the body's initial position for delta tracking
        prevTrackedPos.current.copy(tracked);
        wasTracking.current = true;
        // Sync controls target on first frame
        controls?.target.copy(tracked);
        return;
      }

      // Every subsequent frame: compute how much the body moved
      _delta.subVectors(tracked, prevTrackedPos.current);
      prevTrackedPos.current.copy(tracked);

      // Apply the SAME displacement to both the camera AND the orbit pivot.
      // This keeps the camera's relative position to the body EXACTLY constant
      // regardless of the body's orbital speed.
      // The user's zoom/orbit input from OrbitControls is applied on top of this.
      camera.position.add(_delta);
      controls?.target.add(_delta);

      return;
    }

    wasTracking.current = false;

    // === NORMAL ANIMATION MODE (stars, galaxies — fixed positions) ===
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
      minDistance={0.3}
      maxDistance={3000}
      makeDefault
      onStart={() => {
        if (isTrackingEntity) {
          // Tracking: user orbits around the body — do NOT release tracking
          return;
        }
        // Normal mode: stop focus animation when user takes control
        userInteracted.current = true;
        animating.current = false;
        onCameraFree?.();
      }}
    />
  );
}
