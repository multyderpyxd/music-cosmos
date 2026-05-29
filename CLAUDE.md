# Music Cosmos — Project Instructions for Claude Code

## Product Summary

A 3D interactive web app that transforms personal music listening history into a navigable cosmic universe.

**Core metaphor:**
- Genres = galaxies
- Artists = stars (size = relevance, brightness = recency)
- Albums = planets (distance to star = age, speed = recent plays)
- Tracks = satellites (distance to planet = personal affinity)

**Current phase:** Phase 0 — Foundation complete. Starting Phase 1.

**Development environment:** GitHub Codespaces (repo: https://github.com/multyderpyxd/music-cosmos)

---

## Architectural Rules — NON-NEGOTIABLE

### Import Dependency Graph

```
config          ← no imports from any @music-cosmos package
domain          ← no imports from any @music-cosmos package
testing         ← domain, config
data-adapters   ← domain
normalization   ← domain, config
cosmos-engine   ← domain, config
layout-engine   ← domain, cosmos-engine, config
renderer-3d     ← cosmos-engine, layout-engine, config  (+ React, Three.js, R3F)
ui              ← domain, config  (+ React, NO Three.js)
apps/web        ← all packages  (composition root ONLY)
```

**Any violation of these boundaries is always a bug, never a shortcut.**

### Prohibited Patterns

- `Math.random()` — always use `mulberry32` seeded PRNG from `packages/layout-engine/src/prng/mulberry32.ts`
- Visual rules inside React components — must live in `packages/config/src/visual-rules.ts`
- `setState` or React re-renders inside `useFrame` animation loops — use `instanceMatrix` directly
- Direct Spotify/stats.fm API calls in MVP — use file import adapters only
- `import` from `renderer-3d` or `ui` inside `domain`, `normalization`, or `cosmos-engine`
- Recomputing layout positions per frame — positions are computed once by LayoutEngine
- `any` types — use `unknown` and narrow properly

---

## Key File Locations

| What | Where |
|------|-------|
| Domain types (Genre, Artist, Album, Track) | `packages/domain/src/entities/` |
| Branded ID types | `packages/domain/src/ids/ids.ts` |
| MusicDataset, RawMusicData | `packages/domain/src/dataset/` |
| Visual rules config | `packages/config/src/visual-rules.ts` |
| Render budget config | `packages/config/src/render-budget.ts` |
| Genre taxonomy | `packages/config/src/genre-map.ts` |
| Scaler functions | `packages/normalization/src/metrics/scalers.ts` |
| Metrics aggregator | `packages/normalization/src/metrics/metricsAggregator.ts` |
| Normalization pipeline | `packages/normalization/src/pipeline/normalizationPipeline.ts` |
| mulberry32 PRNG | `packages/layout-engine/src/prng/mulberry32.ts` |
| CosmosMapper | `packages/cosmos-engine/src/mapping/CosmosMapper.ts` |
| LayoutEngine | `packages/layout-engine/src/index.ts` |
| Mock data adapter | `packages/data-adapters/src/mock/MockDataAdapter.ts` |
| Test fixtures | `packages/testing/src/fixtures/` |
| Zustand UI store | `apps/web/src/stores/ui-store.ts` |
| Zustand cosmos store | `apps/web/src/stores/cosmos-store.ts` |
| 3D scene entry | `apps/web/src/scenes/MusicCosmosScene.tsx` |

---

## Package Names and Workspace

All packages are prefixed `@music-cosmos/`:

```
@music-cosmos/domain
@music-cosmos/config
@music-cosmos/testing
@music-cosmos/data-adapters
@music-cosmos/normalization
@music-cosmos/cosmos-engine
@music-cosmos/layout-engine
@music-cosmos/renderer-3d
@music-cosmos/ui
@music-cosmos/web        (apps/web)
```

---

## Testing Policy

**Must test** (high priority):
- `packages/normalization` — scalers, aggregator, deduplicator, pipeline
- `packages/cosmos-engine` — CosmosMapper, visualPropsFactory
- `packages/layout-engine` — mulberry32, determinism invariant, orbit calculators

**Test patterns:**
- Determinism test: run `computeLayout` twice with same seed, assert positions are strictly equal
- Scaler tests: 100% branch coverage, check boundary values (min, max, equal inputs)
- Deduplication test: same artist name with different capitalizations/spaces → single entity

**Run tests:**
```bash
pnpm test
pnpm test:coverage
```

---

## Coding Standards

- TypeScript strict mode, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`
- Branded ID types for all entity IDs — never use `string` where `ArtistId` is expected
- Pure functions for all computation (normalization, scaling, mapping, layout)
- Explicit interfaces at all package boundaries (no structural duck typing across packages)
- No comments explaining WHAT code does — only WHY (hidden constraints, workarounds, invariants)
- No multi-paragraph docstrings

---

## Performance Rules

- `InstancedMesh` for any entity class with >50 simultaneous instances (stars, satellites)
- LOD filtering happens at scene computation time (in `lodFilter.ts`), not during rendering
- Orbital animation: `position = parent + orbitRadius * [cos, sin](orbitPhase + clock.elapsedTime * speed)`
  - `orbitPhase` is computed once by LayoutEngine (deterministic, from mulberry32)
  - `clock.elapsedTime` from R3F's `useFrame` drives animation — never trigger React re-renders
- Layout positions are computed once and cached — never recomputed per frame
- Web Workers for normalization and layout when dataset has >500 tracks (Phase 3)

---

## Data Pipeline Flow

```
DataAdapter.load()
  → RawMusicData
  → normalizationPipeline(raw, config)
  → MusicDataset
  → aggregateMetrics(dataset)
  → Map<string, ListeningStats>
  → mapDatasetToCosmicGraph(dataset, stats, rules, budget, viewMode)
  → CosmicGraph
  → computeLayout(graph, layoutConfig, budget, viewMode)
  → VisualScene
  → <CosmosCanvas scene={scene} />
```

---

## Data Policy

- User data never leaves the browser without explicit user action
- No analytics, no logging of music history
- All processing is local (no server-side computation in MVP)
- Privacy doc: `docs/privacy.md` (to be written in Phase 4)

---

## Common Commands

```bash
# Development
pnpm dev                    # Start Vite dev server (apps/web)

# Type checking
pnpm typecheck              # Run tsc --noEmit across all packages

# Testing
pnpm test                   # Run all tests via vitest workspace
pnpm test:coverage          # With coverage report

# Linting
pnpm lint                   # ESLint across all .ts/.tsx files
pnpm format                 # Prettier format

# Build
pnpm build                  # Build all packages + web app
```

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ Done | Project scaffold, tooling, CLAUDE.md, docs |
| 1 | 🔄 Next | Domain types, mock data, full data pipeline, tests |
| 2 | ⏳ Pending | 3D scene, camera, interactions, UI panels |
| 3 | ⏳ Pending | LOD, render budgets, focus modes, workers |
| 4 | ⏳ Pending | Real data import (stats.fm first, then Spotify) |

---

## Architecture Decisions Log

**PRNG:** mulberry32 chosen over xorshift128. Reason: single 32-bit integer state is trivially serializable as a cache key; pure integer arithmetic avoids floating-point accumulation errors.

**Instancing threshold:** >50 simultaneous instances → `InstancedMesh`. This applies to stars (up to 960 across galaxies in universe view) and satellites (up to hundreds in artist view).

**Galaxy positioning:** Fibonacci sphere algorithm for base positions (deterministic by index, no PRNG needed). Manual overrides per genre in `config/src/layout-config.ts`. Future: t-SNE/UMAP embeddings for genre similarity clustering.

**TypeScript project references:** Not used. Path aliases in Vite config + per-package `tsc --noEmit` is sufficient and avoids build-order complexity. Each package has its own `tsconfig.json` extending `tsconfig.base.json`.

**Workers:** Deferred to Phase 3. Mock dataset is fast enough for synchronous computation in Phase 1-2.
