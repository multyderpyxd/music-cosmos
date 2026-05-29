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

## v0.6 — Visual Polish (deferred, design-heavy)
> Note: Visual improvements are intentionally deferred. The architecture supports them without refactoring.

- [ ] Bloom / glow post-processing (@react-three/postprocessing)
- [ ] Star sprite textures (circular gradient, softer look than sphere geometry)
- [ ] Galaxy particle shaders (animated swirl, arm structure, nebula glow)
- [ ] Planet textures / atmosphere halo
- [ ] Satellite trail effect (short comet-like tail on fast-orbiting moons)
- [ ] Ambient occlusion and depth-of-field for focused views
- [ ] Smooth camera animation curves (easing functions, not linear lerp)
- [ ] Keyboard navigation (arrow keys to cycle entities, Escape to deselect)
- [ ] URL-based state (seed, selected entity, view mode)
- [ ] Mobile-responsive UI overlay

## v0.7 — Entity Sidebar Panel
> Requested: when an artist or album is selected, show a scrollable list on the right
> of all child entities (albums for artist, tracks for album) with a miniature
> celestial body preview as reference thumbnail and the entity name.
> Clicking any list item focuses the camera on that entity.

- [ ] `EntityChildList` component — scrollable right panel
- [ ] Miniature orbit preview (canvas-in-canvas or SVG placeholder thumbnail)
- [ ] Entity name, play count, last played date per list item
- [ ] Click-to-focus: selecting a list item calls `selectEntity(nodeId)` → camera focus
- [ ] Auto-switches view mode to artist when artist selected, album when album selected

## Future (v1.0+)
- [ ] Comets (intense short-term listening)
- [ ] Supernovas (historical listening peaks)
- [ ] Constellation overlays for playlists
- [ ] Desktop app (Tauri wrapper)
- [ ] Social features (shareable snapshots)
- [ ] Genre similarity via embeddings (replace manual layout)
