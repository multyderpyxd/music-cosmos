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

const DEFAULT_TRACK_OFFSET = new THREE.Vector3(14, 7, 14);

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
  // Track whether we were already in tracking mode to detect first frame
  const wasTracking = useRef(false);

  useEffect(() => {
    camera.position.set(0, 200, 800);
    camera.lookAt(0, 0, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger animation toward fixed target (stars, galaxies)
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
    // Body is the pivot. User orbits/zooms freely around it.
    // ONLY the Unfix button exits this mode — dragging does NOT release it.
    if (isTrackingEntity && trackedPositionRef?.current) {
      const tracked = trackedPositionRef.current;

      // On the first frame entering tracking: if camera is far, snap near the body
      if (!wasTracking.current) {
        const dist = camera.position.distanceTo(tracked);
        if (dist > 80) {
          camera.position.copy(tracked).add(DEFAULT_TRACK_OFFSET);
        }
        wasTracking.current = true;
      }

      // Keep orbit pivot on the moving body every frame.
      // OrbitControls applies the user's input relative to this pivot,
      // so rotate/zoom work naturally around the orbiting body.
      controls?.target.copy(tracked);
      return;
    }

    wasTracking.current = false;

    // === NORMAL ANIMATION MODE (stars, galaxies) ===
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
      minDistance={0.5}
      maxDistance={3000}
      makeDefault
      onStart={() => {
        if (isTrackingEntity) {
          // Tracking mode: allow free orbit around the body.
          // Do NOT call onCameraFree — only the Unfix button does that.
          return;
        }
        // Normal mode: stop focus animation when user takes control.
        userInteracted.current = true;
        animating.current = false;
        onCameraFree?.();
      }}
    />
  );
}
