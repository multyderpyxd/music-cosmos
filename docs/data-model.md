# Data Model

## Musical Domain (`@music-cosmos/domain`)

All entities use branded ID types to prevent accidental cross-assignment:

```typescript
type GenreId  = string & { readonly __brand: 'GenreId' };
type ArtistId = string & { readonly __brand: 'ArtistId' };
type AlbumId  = string & { readonly __brand: 'AlbumId' };
type TrackId  = string & { readonly __brand: 'TrackId' };
```

### Genre
Represents a music genre (can be hierarchical via `parentGenreId`).

### Artist
Has a `primaryGenreId` and may belong to multiple genres. Multi-genre artists create gravitational bridges between galaxies in the visualization.

### Album
`type` field encodes album type: `'album' | 'ep' | 'single' | 'compilation' | 'unknown'`

`releaseYear` drives orbit distance from parent star (older albums orbit farther).

### Track
May be orphaned (`albumId` is optional) — orphan tracks become asteroids.

### ListeningStats
Aggregated per-entity listening metrics, computed by `metricsAggregator`. Includes recency buckets (30d, 90d, 365d) for visual brightness calculation.

### MusicDataset
The fully normalized, deduplicated dataset. The `id` field is a hash of source + config, used as a cache key.

## Raw Input (`RawMusicData`)

Adapter output. Contains a flat array of `RawListeningEvent`. The normalization pipeline builds the full entity hierarchy from this.

## Visual Domain (`@music-cosmos/cosmos-engine`, `@music-cosmos/layout-engine`)

### CosmicNode
A visual representation of a musical entity. Links back to the domain via `domainId`.

`entityType` determines visual rendering: `galaxy | star | planet | satellite | asteroid-belt | comet | nebula | constellation | supernova`

### VisualProps
Visual parameters per node: `size`, `brightness`, `color` (RGB 0–1), `mass`, and optional `orbitRadius`, `orbitSpeed`, `orbitPhase`.

### VisualNode
Extends `CosmicNode` with a `position: Vector3` and `lod: number` (Level of Detail — controls visibility per zoom level).

### VisualScene
The final layout output consumed by `renderer-3d`. Contains positioned nodes, edges, camera targets, and scene metadata.
