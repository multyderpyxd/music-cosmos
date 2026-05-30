# Music Cosmos — Project Context

> **Purpose of this file:** Portable context for transferring project knowledge between LLM sessions.
> Last updated: 2026-05-30

---

## 1. What is Music Cosmos?

A web application that transforms a user's personal music listening history into a navigable 3D cosmic universe. It is an artistic/visual piece and a shareable experience.

**Core metaphor:**
- Genres → Galaxies (spiral shape, colored by genre)
- Artists → Stars (size = total plays, brightness = recency)
- Albums → Planets (procedural texture from album artwork, orbit speed = recent plays)
- Tracks → Satellites / Moons (orbit planet, distance = personal affinity)

**Current state:** Functional MVP with mock data + stats.fm live API connection. Visual 3D scene works. Awaiting Spotify Extended History export (requested, up to 30 days).

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.x (strict mode) |
| Frontend | React 18 + Vite 5 |
| 3D Rendering | Three.js r168 + React Three Fiber v8 + drei v9 |
| Post-processing | @react-three/postprocessing + Bloom |
| State management | Zustand v4 |
| Package manager | pnpm workspaces (monorepo) |
| Tests | Vitest |
| Platform | GitHub Codespaces (dev environment) |
| Repository | https://github.com/multyderpyxd/music-cosmos |

---

## 3. Monorepo Structure

```
music-cosmos/
├── apps/
│   └── web/                    # Vite + React entry point (composition root)
│       ├── src/
│       │   ├── app/App.tsx            # Entry: loads stats.fm cache or mock data
│       │   ├── scenes/MusicCosmosScene.tsx  # Main UI coordinator
│       │   ├── stores/
│       │   │   ├── ui-store.ts        # UI state (selection, filters, pause, tracking)
│       │   │   └── cosmos-store.ts    # Data pipeline state + albumImages map
│       │   ├── components/
│       │   │   ├── CosmosPanel.tsx    # Unified navigation panel (right side)
│       │   │   ├── EntityTypeToggles.tsx  # Bottom visibility toggles
│       │   │   ├── ImportPanel.tsx    # Data import modal
│       │   │   ├── StatsFmConnect.tsx # stats.fm username connect UI
│       │   │   └── EntityTypeToggles.tsx
│       │   ├── lib/
│       │   │   └── statsFmApi.ts      # stats.fm API client + localStorage cache
│       │   └── styles/ui.css          # UI hover/focus/scroll CSS (scoped to .cosmos-ui)
│
├── packages/
│   ├── domain/         # Pure TypeScript types — no deps
│   ├── config/         # Visual rules, render budgets, scalers, genre map
│   ├── data-adapters/  # MockDataAdapter, StatsFmImportAdapter, SpotifyExportAdapter,
│   │                   # StatsFmApiAdapter (live API)
│   ├── normalization/  # Dedup, metrics aggregation, pipeline
│   ├── cosmos-engine/  # Maps MusicDataset → CosmicGraph (visual props)
│   ├── layout-engine/  # Positions CosmicGraph in 3D (deterministic, seeded)
│   ├── renderer-3d/    # R3F components: scene, camera, objects, textures
│   ├── ui/             # React UI components (SearchBar, Legend, HoverTooltip, Icons)
│   └── testing/        # Fixtures and builders for tests
│
├── docs/               # architecture.md, data-model.md, visual-language.md,
│                       # performance.md, roadmap.md, privacy.md
├── CLAUDE.md           # Project rules for Claude Code sessions
├── CONTEXT.md          # This file
└── pnpm-workspace.yaml
```

---

## 4. Import Boundary Rules (ENFORCED)

```
config          ← no imports from other @music-cosmos packages
domain          ← no imports from other @music-cosmos packages
testing         ← domain, config
data-adapters   ← domain
normalization   ← domain, config
cosmos-engine   ← domain, config
layout-engine   ← domain, cosmos-engine, config
renderer-3d     ← cosmos-engine, layout-engine, config  [+ React, Three.js, R3F]
ui              ← domain, config  [+ React, NO Three.js]
apps/web        ← all packages  (composition root)
```

Enforced by ESLint `import/no-restricted-paths` in `.eslintrc.cjs`.

---

## 5. Data Pipeline

```
DataAdapter.load()              ← MockDataAdapter | StatsFmApiAdapter | SpotifyExportAdapter
  → RawMusicData { source, importedAt, events: RawListeningEvent[] }
  → normalize(raw)              ← dedup, alias resolution, metrics aggregation
  → MusicDataset { genres, artists, albums, tracks, stats, events }
  → mapDatasetToCosmicGraph()   ← applies VisualRules + RenderBudget
  → CosmicGraph { nodes, edges, rootIds }
  → computeLayout()             ← positions in 3D, LOD assignment, seeded PRNG
  → VisualScene { nodes: VisualNode[], edges, cameraTargets, metadata }
  → <CosmosCanvas scene={scene} />   ← R3F rendering
  → UI interactions via Zustand stores
```

---

## 6. Key Domain Types

```typescript
// packages/domain/src/

// Branded IDs prevent cross-assignment
type GenreId = string & { __brand: 'GenreId' };
type ArtistId = string & { __brand: 'ArtistId' };
type AlbumId  = string & { __brand: 'AlbumId' };
type TrackId  = string & { __brand: 'TrackId' };

interface ListeningStats {
  entityId; entityType; totalPlays; totalMinutes;
  firstPlayedAt; lastPlayedAt;
  playsLast30Days; playsLast90Days; playsLast365Days;
}

interface MusicDataset {
  id: string;  // hash for caching
  genres: Map<GenreId, Genre>;
  artists: Map<ArtistId, Artist>;
  albums: Map<AlbumId, Album>;
  tracks: Map<TrackId, Track>;
  stats: Map<string, ListeningStats>;
  events: ListeningEvent[];
  computedAt: Date;
  sourceAdapter: string;
}

// Visual layer
interface CosmicNode {
  id: string;  // e.g. "star:a:burial"
  entityType: CosmicEntityType;  // galaxy | star | planet | satellite | asteroid-belt
  domainId: string;  // links back to Genre/Artist/Album/Track id
  parentId?: string;
  visualProps: VisualProps;  // size, brightness, color[3], mass, orbitRadius, orbitPhase, orbitSpeed
  label: string;
  metadata: Record<string, unknown>;
}

interface VisualNode extends CosmicNode {
  position: { x, y, z };
  lod: number;  // 0=galaxy (always), 1=star, 2=planet, 3=satellite
}
```

---

## 7. Visual Rules (packages/config/src/visual-rules.ts)

- **Galaxy size**: sqrt scale of totalMinutes → 80–400 units
- **Star size**: log scale of totalPlays → 0.4–4 units
- **Star brightness**: 0.55 + 0.45 * recencyDecay(90-day half-life) * activityBoost
- **Planet size**: log scale of totalPlays → 0.15–1.2 units
- **Planet orbit radius**: linear of album release age → 6–30 units (old = far)
- **Planet orbit speed**: sqrt of playsLast90Days → 0.03–0.8
- **Satellite orbit radius**: personal affinity (inverse) → 1.5–4 units
- **All scalers live in**: `packages/config/src/scalers.ts` (pure functions)
- **PRNG**: mulberry32 (packages/layout-engine/src/prng/) — deterministic, integer-based

---

## 8. 3D Scene Architecture

### Galaxy (`GalaxyObject.tsx`)
- 2-arm logarithmic spiral particle distribution (FBM-distorted)
- Central bulge (18% of particles, warmer color)
- Tiny nucleus sphere (radius × 0.035) with HDR color (×5) → blooms
- Invisible click area (opacity=0 transparent sphere, radius × 0.25)

### Stars (`StarPoints.tsx`)
- `THREE.Points` with BufferGeometry vertex colors — avoids InstancedMesh shader issues
- HDR colors (×3.5) for reliable bloom
- Bloom selective: dimFactor=0.38 when any entity selected → soft bloom preserved
- dimFactor=0.38 → 0.6 * 0.38 * 3.5 ≈ 0.80 → right at bloom threshold

### Planets (`AnimatedPlanet.tsx`)
- Individual meshes with orbital animation in `useFrame`
- **Procedural textures** (planetTexture.ts):
  - If albumImageUrl available: extract 3 dominant colors via k-means on 56×56 Canvas
  - Else: compute 3 colors via HSL hue rotation from planet's base color
  - Generate 256×256 FBM banded texture (Jupiter-like bands with domain warping)
  - Cached globally per palette + seed
- Smooth pause: accumulated time with lerp speedScale (not abrupt freeze)

### Satellites (`AnimatedSatellite.tsx`)
- Individual meshes
- **Track parent planet live position every frame**: recomputes planet's orbital position using stored params
  - `px = starX + r_planet * cos(phase_p + t * speed_p)`
  - `satX = px + r_sat * cos(phase_s + t * speed_s)`
- This ensures satellites orbit around the MOVING planet, not its initial position

### Camera (`CosmosCamera.tsx`)
- OrbitControls with damping
- **Tracking mode** (planets/satellites): `controls.target.copy(trackedPos)` every frame
  - Applies delta to both camera AND target → no drift
  - `onStart` does NOT call onCameraFree in tracking mode
- **Fixed animation mode** (stars/galaxies): lerp to computed CameraTarget
- Reset: `resetKey` counter increments → camera lerps to (0, 200, 800)

### Post-processing
- `EffectComposer` + `Bloom` (luminanceThreshold=0.8, intensity=1.8, mipmapBlur)
- Galaxy cores: HDR×5 → always blooms
- Stars: HDR×3.5 (points) → blooms with luminance ≈ 2.1 in default state
- Dimmed stars: luminance ≈ 0.80 → soft bloom preserved

---

## 9. UI Components

### CosmosPanel (apps/web/src/components/)
- Right-side panel (300px) when entity selected
- **Breadcrumb navigation**: clickable ancestors (e.g. Electronic › Burial)
- **Back button**: ← parent entity
- **Entity stats**: plays, time, 30d/90d recency, last heard
- **Visual bars**: size, brightness, mass (2px height)
- **Children list**: albums for artist, tracks for album — sorted by plays
  - Mini celestial body (dot + ring for planets)
  - Green dot if active in last 30 days
  - Click → selects entity and camera focuses

### EntityTypeToggles (bottom center)
- 4 toggle buttons: Galaxies ⭐ Stars 🪐 Planets 🌙 Moons
- Empty = show all. Non-empty = show ONLY selected types
- ✦ button: cycles galaxy nebula opacity (0/25/55/85%)
- CSS classes from ui.css for hover/active states

### Controls (bottom-right)
- 🏠 Reset camera (returns to universe view)
- ⏸/▶ Pause orbital motion (smooth deceleration via lerp speedScale)
- `ui-ctrl-btn` CSS class for consistent look

### Unfix Camera button (center-bottom, conditional)
- Appears when tracking a planet/satellite
- `ui-unfix-btn` CSS class
- Only way to exit tracking mode (dragging does NOT exit it)

### ImportPanel
- **stats.fm live connection** (recommended): username input → API fetch → cache 24h
- **File drop**: Spotify Extended History JSON
- Drag & drop zone with format auto-detection
- Privacy note

### SearchBar (top center)
- Real-time filter of scene nodes
- Dropdown with entity type icon + label
- SVG search icon inline

### VisualLegend (bottom-left)
- Collapsible ℹ button
- Lists entities (Galaxy=Genre etc.) and visual encodings

---

## 10. stats.fm API Integration

**File**: `apps/web/src/lib/statsFmApi.ts`

**Endpoints used** (verified from live API inspection):
```
GET /api/v1/users/{username}
  Response: { item: { id, customId, displayName, privacySettings: { profile: bool, ... } } }

GET /api/v1/users/{uid}/top/artists?range=lifetime&limit=50
  Response: { items: [{ position, streams: null|number, artist: { id, name, genres[] } }] }
  NOTE: streams is NULL for users without imported Spotify history

GET /api/v1/users/{uid}/top/tracks?range=lifetime&limit=100
  Response: { items: [{ position, streams: null|number, track: { id, name, durationMs,
                          artists: [{ id, name, image }], albums: [{ id, name, image }] } }] }
  NOTE: track.artists has id/name/image but NO genres

GET /api/v1/users/{uid}/streams?limit=200
  Response: { items: [{ id, userId, endTime, playedMs, trackId, trackName,
                         albumId, artistIds: number[] }] }
  NOTE: FLAT structure, no nested track object. artistIds are numeric only.

Errors: { message: string, path: string, code: string }
```

**Caching**: `localStorage` key `cosmos_statsfm_v3`, TTL 24h

**Data synthesis** (when streams=null):
- `playsFromPosition(pos) = Math.max(2, Math.round(200 / pos^0.55))`
  - Position 1 ≈ 200 plays, position 10 ≈ 95, position 50 ≈ 50

**StatsFmApiAdapter** (packages/data-adapters/):
- Builds genre map from `topArtists.artist.genres` (only source of genres)
- Matches `recentStreams.trackName` against `topTracks` to resolve artist names
- Generates synthetic events for remaining plays distributed over 730 days with recency bias

**App startup**: loads cached stats.fm data automatically if available; else mock data.

---

## 11. Data Sources

| Source | Status | Notes |
|--------|--------|-------|
| Mock data | ✅ Working | 5 artists, 10 albums, ~400 synthetic events |
| stats.fm live API | ✅ Working | Connect with username, 24h cache. streams=null for users without imported history |
| Spotify Extended History (JSON) | ✅ Adapter built, UI ready | User has requested export, awaiting (up to 30 days) |
| stats.fm JSON export | ✅ Adapter built | Instant if user has Plus account |

**User**: `jozemigel_23` on stats.fm (Spanish indie/rock taste based on top tracks observed)

---

## 12. Zustand Stores

### ui-store.ts
```typescript
selectedEntityId: string | null
hoveredEntityId: string | null
searchQuery: string
isTrackingEntity: boolean    // planet/satellite selected → camera tracks it
isPaused: boolean            // orbital motion paused
activeEntityTypes: Set<string>  // empty=show all, non-empty=filter
galaxyParticleOpacity: number  // 0/0.25/0.55/0.85
isImportPanelOpen: boolean
resetCameraKey: number       // increment → camera resets to universe view
```

### cosmos-store.ts
```typescript
rawData: RawMusicData | null
dataset: MusicDataset | null
scene: VisualScene | null
isLoading: boolean
error: string | null
albumImages: Map<string, string>  // albumTitle.lower → image URL (from stats.fm)

// Actions:
loadMockData()
importFile(file: File)
loadFromStatsFm(data: StatsFmApiData)
recomputeScene(viewMode: ViewMode)
```

---

## 13. Planet Texture System

**File**: `packages/renderer-3d/src/textures/planetTexture.ts`

### Color extraction (from album artwork)
1. Load image with `crossOrigin="anonymous"` (Spotify/Apple Music CDNs support CORS)
2. Draw to 56×56 Canvas
3. k-means (k=3, 10 iterations) on sampled pixels → 3 dominant colors
4. Cache per URL in module-level Map

### Fallback palette (mock data / CORS failure)
- Convert base color to HSL
- 3 colors: base - 12% lightness, base + hue rotation (25–55°), base + 12% lightness

### Texture generation (FBM banded pattern)
```
For each pixel (u, v) in 256×256:
  1. Domain warp with fbm(u*2.5, v*2.5, seed) → (wu, wv)
  2. Band = sin(wv * π * 5.5 + wu * 1.2) → banded structure
  3. Fine detail = fbm(u*7, v*7, ...) * 0.18
  4. t = clamp(band + detail)
  5. Map t through 3-color palette (smoothstep blend)
  6. Brightness modulation = 0.82 + fbm(u*5, v*5) * 0.36
```
Result: Jupiter/gas-giant-like banded appearance with organic turbulence.

### Flow
```
AnimatedPlanet.albumImageUrl
  → createPlanetTexture(url, fallbackColor, seed)
  → extractColors(url) OR computeFallbackPalette(color, seed)
  → generatePlanetTexture(colors, seed)
  → THREE.CanvasTexture applied to MeshStandardMaterial.map
```

Textures are cached globally. Same album → same texture across re-renders.

---

## 14. Camera System

### Focus modes
- **Galaxy/Star selected**: lerps camera to `CameraTarget.position`, `controls.target` to `CameraTarget.lookAt`
- **Planet/Satellite selected**: TRACKING MODE
  - `controls.target.copy(trackedPos)` every frame (pivot on moving body)
  - Camera position translated by `delta = trackedPos - prevTrackedPos` each frame (no drift)
  - User can orbit freely around the body; dragging does NOT release tracking
  - Only "Unfix camera" button exits tracking

### Focus distances (layout-engine/src/index.ts)
- Galaxy: max(120, size * 2.5) units
- Star: 90 units (sees all orbiting planets within max orbit 30)
- Planet: 14 units (sees satellites within orbit 4)
- Satellite: 6 units

### Camera reset
- `resetCamera()` in ui-store increments `resetCameraKey`
- `CosmosCamera` useEffect on `resetKey` → animates to (0, 200, 800), lookAt (0,0,0)
- Also deselects entity and stops tracking

---

## 15. LOD System

| LOD | Entity type | Visible in view mode |
|-----|-------------|---------------------|
| 0 | Galaxy | All views |
| 1 | Star | galaxy, artist, album |
| 2 | Planet | artist, album |
| 3 | Satellite, asteroid-belt | album only |

Currently: app always loads with `viewMode='album'` (all entities) and user controls visibility via `EntityTypeToggles`.

---

## 16. Known Issues / Limitations

1. **stats.fm `streams=null`**: Users without imported Spotify history get synthetic play counts based on ranking position. The cosmos is approximate, not data-accurate.

2. **Genre resolution for streams**: stats.fm streams only have `trackName` and numeric `artistIds`. Artist names for stream events are resolved by matching trackName against topTracks. If a track appears in streams but not in topTracks, it gets no artist → event is skipped.

3. **Spotify Extended History**: Adapter exists (`SpotifyExportAdapter`) but user is waiting for the export from Spotify (up to 30 days from request date: 2026-05-30).

4. **Visual polish deferred**: Bloom tuning, better galaxy shaders, star sprite textures are deferred to v0.6 (documented in roadmap.md).

5. **Web Workers**: Not implemented. Normalization and layout run synchronously on main thread. Fine for current data sizes; may need workers for very large datasets.

6. **Stats in EntityPanel**: Stats are shown from `dataset.stats` which is populated by the normalization pipeline. For users with `streams=null` from stats.fm, the play counts shown are synthetic.

7. **Planet CORS**: Some Apple Music CDN album images may not support CORS. These planets fall back to procedural palette from base color.

---

## 17. Pending Features (Roadmap)

**Immediate (before v1):**
- Test with real Spotify Extended History data when export arrives
- EntityChildList: mini celestial body preview in the children list of CosmosPanel

**v0.6 — Visual Polish:**
- Bloom/glow fine-tuning
- Better star sprites (circular gradient texture)
- Galaxy spiral shader improvements

**v0.7 — Entity Child Panel:**
- When artist selected: show album list with mini planet preview + click to focus
- When album selected: show track list with mini moon preview + click to focus

**v1.0+:**
- Desktop app (Tauri wrapper)
- Social features (shareable snapshots)
- Genre similarity via embeddings
- Constellation overlay for playlists

---

## 18. Development Commands

```bash
# All commands run in the Codespace terminal

pnpm install        # Install dependencies (first time or after package.json changes)
pnpm dev            # Start Vite dev server on port 5173
pnpm typecheck      # TypeScript check across all packages
pnpm test           # Run all tests (vitest workspace)
pnpm lint           # ESLint
pnpm build          # Production build
```

---

## 19. Key Files Quick Reference

| What you're looking for | File |
|------------------------|------|
| Domain types | `packages/domain/src/` |
| Visual rules (sizes, colors) | `packages/config/src/visual-rules.ts` |
| Scalers (log, sqrt, recency) | `packages/config/src/scalers.ts` |
| Normalization pipeline | `packages/normalization/src/pipeline/normalizationPipeline.ts` |
| CosmosMapper (domain → visual) | `packages/cosmos-engine/src/mapping/CosmosMapper.ts` |
| Layout engine (positions) | `packages/layout-engine/src/index.ts` |
| PRNG (mulberry32) | `packages/layout-engine/src/prng/mulberry32.ts` |
| Galaxy 3D object | `packages/renderer-3d/src/objects/GalaxyObject.tsx` |
| Star rendering | `packages/renderer-3d/src/objects/StarPoints.tsx` |
| Planet rendering + texture | `packages/renderer-3d/src/objects/AnimatedPlanet.tsx` |
| Planet texture generator | `packages/renderer-3d/src/textures/planetTexture.ts` |
| Satellite rendering | `packages/renderer-3d/src/objects/AnimatedSatellite.tsx` |
| Camera controller | `packages/renderer-3d/src/camera/CosmosCamera.tsx` |
| Main scene assembler | `packages/renderer-3d/src/scene/CosmosScene.tsx` |
| stats.fm API client | `apps/web/src/lib/statsFmApi.ts` |
| stats.fm adapter | `packages/data-adapters/src/statsfm/StatsFmApiAdapter.ts` |
| Main navigation panel | `apps/web/src/components/CosmosPanel.tsx` |
| UI state | `apps/web/src/stores/ui-store.ts` |
| Data + scene state | `apps/web/src/stores/cosmos-store.ts` |
| UI CSS (hover/focus) | `apps/web/src/styles/ui.css` |
| SVG icon library | `packages/ui/src/icons/Icons.tsx` |
| App entry + cache load | `apps/web/src/app/App.tsx` |
| Main scene coordinator | `apps/web/src/scenes/MusicCosmosScene.tsx` |

---

## 20. Architecture Decisions Log

| Decision | Choice | Reason |
|----------|--------|--------|
| Monorepo tooling | pnpm workspaces | Clean import boundaries, easy desktop extraction |
| PRNG | mulberry32 | Single 32-bit integer state, integer arithmetic, easy cache key |
| Star rendering | THREE.Points + vertex colors | Avoids InstancedMesh USE_INSTANCING_COLOR shader timing issue |
| Planet rendering | Individual meshes + useFrame | Orbital animation per-planet; InstancedMesh color init issues |
| Planet textures | Canvas API + FBM noise | No external deps, deterministic, visually rich |
| Satellite tracking | Recompute parent planet position every frame | Avoids satellite orbiting empty space when parent planet has moved |
| Camera tracking | `delta = tracked - prevTracked` applied to both camera + controls.target | Prevents drift: maintains exact relative offset |
| Galaxy shape | 2-arm logarithmic spiral FBM particles | Visually distinct from stars; recognizable as galaxy |
| stats.fm vs Spotify OAuth | stats.fm username (no OAuth) | Real play counts, no developer app required |
| TypeScript project refs | Not used — path aliases only | Simpler, avoids build-order complexity with Vite |
| Bloom implementation | HDR colors (>1) on star/galaxy materials | Standard Bloom threshold requires luminance > 0.8; stars at ×3.5 |
