# Roadmap

## v0.1 — Phase 0: Foundation ✅
- [x] Monorepo scaffold (pnpm workspaces)
- [x] TypeScript strict mode across all packages
- [x] ESLint with import boundary enforcement
- [x] Vitest workspace setup
- [x] CLAUDE.md with architectural rules
- [x] Core documentation

## v0.2 — Phase 1: Data Pipeline
- [ ] All domain types (Genre, Artist, Album, Track, etc.)
- [ ] Branded ID types
- [ ] Mock data with realistic listening history
- [ ] MockDataAdapter
- [ ] Normalization pipeline (dedup, aliases, unknown entities)
- [ ] Metrics aggregation (plays, minutes, recency buckets)
- [ ] Scalers (log, sqrt, linear, recency decay)
- [ ] CosmosMapper (domain → CosmicGraph)
- [ ] mulberry32 PRNG
- [ ] LayoutEngine (Fibonacci sphere, Vogel spiral, orbital mechanics)
- [ ] Full test coverage for all pure functions
- [ ] Determinism invariant test

## v0.3 — Phase 2: 3D Scene
- [ ] React Three Fiber Canvas setup
- [ ] InstancedStars, InstancedSatellites
- [ ] Galaxy rendering (particle disc + nebula halo)
- [ ] Planet and satellite rendering
- [ ] Orbital animation (useFrame, time-based)
- [ ] Click selection + hover tooltip
- [ ] Zustand stores (cosmos-store, ui-store)
- [ ] Side panel (entity stats)
- [ ] Search bar
- [ ] Visual legend
- [ ] View mode selector (Universe / Galaxy / Artist / Album)

## v0.4 — Phase 3: Progressive Detail
- [ ] LOD enforcement per view mode
- [ ] Render budget enforcement
- [ ] Asteroid belt for unrendered tracks
- [ ] Focus mode: artist (zoom to star system)
- [ ] Focus mode: album (zoom to planet)
- [ ] FPS counter
- [ ] Web Workers for normalization and layout
- [ ] Layout caching (localStorage)

## v0.5 — Phase 4: Real Data Import
- [ ] StatsFmImportAdapter (stats.fm JSON export)
- [ ] SpotifyExportAdapter (Spotify extended streaming history)
- [ ] File drag-and-drop UI
- [ ] Auto-detection of export format
- [ ] SpotifyMetadataAdapter (optional, isolated)
- [ ] Privacy documentation

## v0.6 — Polish
- [ ] Bloom post-processing
- [ ] Camera animation transitions
- [ ] Keyboard navigation
- [ ] URL-based state (seed, selected entity)
- [ ] Mobile-responsive UI overlay

## Future (v1.0+)
- [ ] Comets (intense short-term listening)
- [ ] Supernovas (historical listening peaks)
- [ ] Constellation overlays for playlists
- [ ] Desktop app (Tauri wrapper)
- [ ] Social features (shareable snapshots)
- [ ] Genre similarity via embeddings (replace manual layout)
