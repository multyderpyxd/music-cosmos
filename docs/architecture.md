# Architecture

## Overview

Music Cosmos is a 3D interactive web app that transforms personal music listening history into a navigable cosmic universe. The architecture is organized in strict dependency layers to keep each concern isolated and testable.

## Dependency Graph

```
config          ← no internal deps (pure config + math utilities)
domain          ← no internal deps (pure TypeScript types)
testing         ← domain, config
data-adapters   ← domain
normalization   ← domain, config
cosmos-engine   ← domain, config
layout-engine   ← domain, cosmos-engine, config
renderer-3d     ← cosmos-engine, layout-engine, config  (+ React, Three.js, R3F)
ui              ← domain, config  (+ React, NO Three.js)
apps/web        ← all packages (composition root)
```

No package may introduce a circular dependency.

## Data Pipeline

```
DataAdapter.load()
  → RawMusicData
  → normalize(raw, config)
  → MusicDataset (with aggregated ListeningStats)
  → mapDatasetToCosmicGraph(dataset, stats, rules, budget, viewMode)
  → CosmicGraph
  → computeLayout(graph, layoutConfig, budget, viewMode)
  → VisualScene
  → <CosmosCanvas scene={scene} />  (renderer-3d)
  → UI interactions via Zustand stores
```

## Package Descriptions

### `@music-cosmos/domain`
Pure TypeScript interfaces for all musical entities. No runtime dependencies. This is the single source of truth for the data model.

Key types: `Genre`, `Artist`, `Album`, `Track`, `ListeningEvent`, `ListeningStats`, `MusicDataset`, `RawMusicData`

Branded ID types (`GenreId`, `ArtistId`, etc.) prevent accidental cross-entity ID assignment.

### `@music-cosmos/config`
Configuration constants, visual rules, render budgets, and mathematical utilities (scalers). No runtime dependencies.

Key exports: `VisualRules`, `RenderBudget`, `LayoutConfig`, `ViewMode`, `scaleByMethod`, `recencyDecay`

### `@music-cosmos/data-adapters`
Converts raw source data into `RawMusicData` for the normalization pipeline. Each adapter is interchangeable.

- `MockDataAdapter` — built-in synthetic data
- `StatsFmImportAdapter` — stats.fm JSON export
- `SpotifyExportAdapter` — Spotify extended streaming history
- `JsonImportAdapter` — generic Music Cosmos JSON format

### `@music-cosmos/normalization`
Transforms `RawMusicData` into a clean `MusicDataset`. Handles deduplication, alias resolution, unknown entity creation, and metrics aggregation.

### `@music-cosmos/cosmos-engine`
Maps musical entities to cosmic visual representations. Applies visual rules to compute size, brightness, color, mass, and orbital parameters.

Output: `CosmicGraph` (nodes + edges + root galaxy IDs)

### `@music-cosmos/layout-engine`
Positions `CosmicGraph` nodes in 3D space deterministically. Uses a seeded PRNG (mulberry32) to ensure reproducible layouts.

- Galaxy positions: Fibonacci sphere algorithm
- Star positions: Vogel spiral within galaxy disc
- Planet/satellite positions: parametric orbits

Output: `VisualScene` (nodes with positions + LOD levels)

### `@music-cosmos/renderer-3d`
React Three Fiber components for rendering `VisualScene`. Uses `InstancedMesh` for entity classes with >50 simultaneous instances.

### `@music-cosmos/ui`
React UI components: search, side panel, filters, legend, view mode selector. No Three.js dependencies.

### `@music-cosmos/web` (apps/web)
Composition root. Wires all packages together via Zustand stores.

## Determinism

The layout engine is fully deterministic given the same seed and dataset. This is enforced by:
1. Using mulberry32 (integer arithmetic PRNG) instead of Math.random()
2. Testing: `computeLayout` run twice with same seed → positions are strictly `===` equal

## LOD System

LOD levels control which entities are visible at each zoom level:

| LOD | Entity type | Visible in |
|-----|-------------|------------|
| 0 | Galaxy | All views |
| 1 | Star | galaxy, artist, album |
| 2 | Planet | artist, album |
| 3 | Satellite, asteroid-belt | album only |
