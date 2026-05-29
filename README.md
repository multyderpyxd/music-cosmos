# Music Cosmos

> Transform your personal music history into a navigable 3D cosmic universe.

Genres become galaxies. Artists become stars. Albums orbit as planets. Tracks spin as satellites.

## Development

This project is developed in **GitHub Codespaces**.

1. Open [https://github.com/multyderpyxd/music-cosmos](https://github.com/multyderpyxd/music-cosmos)
2. Click **Code → Codespaces → Create codespace on main**
3. Inside the Codespace terminal:

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

4. Click the forwarded port notification to open the app in your browser.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full architectural overview.

**Package structure:**

```
packages/
  domain/         Pure TypeScript domain types (Genre, Artist, Album, Track)
  config/         Visual rules, render budgets, feature flags
  data-adapters/  MockDataAdapter, StatsFmImportAdapter, SpotifyExportAdapter
  normalization/  Deduplication, metrics aggregation, data pipeline
  cosmos-engine/  Maps MusicDataset → CosmicGraph (visual properties)
  layout-engine/  Positions CosmicGraph in 3D space (deterministic, seeded)
  renderer-3d/    React Three Fiber rendering of VisualScene
  ui/             React UI components (panels, search, filters, legend)
  testing/        Shared test fixtures and builders

apps/
  web/            Vite + React entry point (composition root)
```

## Commands

```bash
pnpm dev            # Start development server
pnpm typecheck      # Type check all packages
pnpm test           # Run test suite
pnpm test:coverage  # Tests with coverage report
pnpm lint           # ESLint
pnpm build          # Production build
```

## Data Sources (MVP)

The app works fully offline. Import your music history as a local file:

- **stats.fm export** — Export from [stats.fm](https://stats.fm) settings
- **Spotify extended history** — Request from Spotify privacy settings (takes ~30 days)
- **Mock data** — Built-in for development and testing

Your data never leaves your browser.

## Roadmap

| Phase | Description |
|-------|-------------|
| 0 ✅ | Project scaffold and tooling |
| 1 | Full data pipeline with mock data |
| 2 | 3D scene with interactions and UI |
| 3 | LOD system, focus modes, performance |
| 4 | Real data import (stats.fm + Spotify) |
