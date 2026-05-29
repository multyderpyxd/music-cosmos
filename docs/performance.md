# Performance

## Render Budget System

The app enforces configurable render budgets per view mode to keep the GPU workload manageable regardless of dataset size.

| View | Galaxies | Stars | Albums | Tracks |
|------|----------|-------|--------|--------|
| Universe | 24 | 40/galaxy | 0 | 0 |
| Galaxy | All | 120 | 3/artist | 0 |
| Artist | 1 | 1 | 80 | 8/album |
| Album | 1 | 1 | 1 | 80 |

Entities beyond the budget are never discarded from the dataset — they're aggregated into `asteroid-belt` nodes with a `hiddenCount` in metadata.

## Instancing

Any entity class with >50 simultaneous visible instances uses `THREE.InstancedMesh`.

- Stars: `InstancedStars.tsx`
- Satellites: `InstancedSatellites.tsx`
- Galaxies: individual meshes + particle system for the nebula halo

## Animation

Orbital animations run in `useFrame` using time-based math, not physics simulation:

```
position.x = parent.x + orbitRadius * cos(orbitPhase + elapsedTime * orbitSpeed)
position.z = parent.z + orbitRadius * sin(orbitPhase + elapsedTime * orbitSpeed)
```

`orbitPhase` is computed once by the layout engine (deterministic, from mulberry32).
`elapsedTime` from R3F's clock drives animation — **never** triggers React re-renders.

## LOD

LOD levels filter the `VisualScene` before it reaches the renderer:

- Level 0 (always): galaxies
- Level 1: stars (galaxy view +)
- Level 2: planets (artist view +)
- Level 3: satellites, asteroid belts (album view only)

Filtering happens in `packages/layout-engine/src/lod/lodFilter.ts` — not inside rendering components.

## Web Workers (Phase 3)

For large datasets (>500 tracks), the normalization and layout computation will be offloaded to Web Workers via Vite's `?worker` syntax to avoid blocking the main thread.

## Layout Caching

`VisualScene` is cacheable by hash of `(datasetId, seed, viewMode)`. The same dataset with the same seed always produces the same layout, so it can be stored in `localStorage` and reused across sessions.
