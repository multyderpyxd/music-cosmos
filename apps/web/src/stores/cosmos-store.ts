import { create } from 'zustand';
import type { RawMusicData, MusicDataset } from '@music-cosmos/domain';
import type { ViewMode } from '@music-cosmos/config';
import type { VisualScene } from '@music-cosmos/layout-engine';
import { MockDataAdapter, StatsFmImportAdapter, SpotifyExportAdapter, StatsFmApiAdapter, SpotifyProfileSnapshotAdapter, isSpotifyProfileSnapshot } from '@music-cosmos/data-adapters';
import type { StatsFmApiData, SpotifyProfileSnapshot } from '@music-cosmos/data-adapters';
import { normalize } from '@music-cosmos/normalization';
import { mapDatasetToCosmicGraph } from '@music-cosmos/cosmos-engine';
import { computeLayout } from '@music-cosmos/layout-engine';
import { defaultVisualRules, defaultRenderBudget, defaultLayoutConfig } from '@music-cosmos/config';

interface CosmosState {
  rawData: RawMusicData | null;
  dataset: MusicDataset | null;
  scene: VisualScene | null;
  isLoading: boolean;
  error: string | null;
  /** albumTitle.toLowerCase() → image URL (from stats.fm album artwork) */
  albumImages: Map<string, string>;
  loadMockData: () => Promise<void>;
  importFile: (file: File) => Promise<void>;
  loadFromStatsFm: (data: StatsFmApiData) => Promise<void>;
  loadFromSpotifyProfile: (snapshot: SpotifyProfileSnapshot) => Promise<void>;
  recomputeScene: (viewMode: ViewMode) => void;
}

interface BuildResult { scene: VisualScene; dataset: MusicDataset }

async function buildScene(raw: RawMusicData, viewMode: ViewMode): Promise<BuildResult> {
  const dataset = normalize(raw);
  const graph = mapDatasetToCosmicGraph(dataset, dataset.stats, defaultVisualRules, defaultRenderBudget, viewMode);
  const scene = computeLayout(graph, defaultLayoutConfig, defaultRenderBudget, viewMode);
  return { scene, dataset };
}

/**
 * Asynchronously enriches artists without a known genre using Last.fm tags.
 * Non-blocking — rebuilds the scene after enrichment if the store setter is provided.
 * Called AFTER the initial cosmos is displayed.
 */
async function enrichWithLastFm(
  dataset: ReturnType<typeof normalize>,
  raw: RawMusicData,
  viewMode: ViewMode,
  onRebuilt: (result: BuildResult) => void,
): Promise<void> {
  try {
    // Lazy import — only loads if user has a Last.fm API key
    const { getArtistGenreEvidence, hasLastFmApiKey } = await import('../lib/lastFmApi.js');
    if (!hasLastFmApiKey()) return;

    const { genreId } = await import('@music-cosmos/domain');
    const { resolveGenres } = await import('@music-cosmos/normalization');

    // Find artists that resolved to g:unknown
    const unknownArtists = [...dataset.artists.values()]
      .filter((a) => String(a.primaryGenreId) === 'g:unknown')
      .slice(0, 30);   // cap at 30 to avoid hammering the API

    if (unknownArtists.length === 0) return;

    let enriched = 0;
    for (const artist of unknownArtists) {
      const evidence = await getArtistGenreEvidence(artist.name);
      if (evidence.length === 0) continue;

      const resolved = resolveGenres(evidence);
      if (resolved.usedFallback) continue;

      artist.primaryGenreId = resolved.primaryGenreId;
      artist.genreIds = resolved.genreIds;
      enriched++;
    }

    if (enriched > 0) {
      // Rebuild scene with updated genre assignments
      const result = await buildScene(raw, viewMode);
      onRebuilt(result);
    }
  } catch { /* Last.fm enrichment is non-critical — never block the cosmos */ }
}

/** Extract album title → image URL from stats.fm API data */
function extractAlbumImages(apiData: StatsFmApiData): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of apiData.topTracks) {
    const album = item.track?.albums?.[0] as { name?: string; image?: string } | undefined;
    if (album?.name && album.image) {
      map.set(album.name.toLowerCase(), album.image);
    }
  }
  return map;
}

export const useCosmosStore = create<CosmosState>((set, get) => ({
  rawData: null,
  dataset: null,
  scene: null,
  isLoading: false,
  error: null,
  albumImages: new Map(),

  loadMockData: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await new MockDataAdapter().load();
      const { scene, dataset } = await buildScene(raw, 'album');
      set({ rawData: raw, dataset, scene, albumImages: new Map(), isLoading: false });
      // Non-blocking Last.fm enrichment — fires and forgets
      void enrichWithLastFm(dataset, raw, 'album', ({ scene: s, dataset: d }) => {
        set({ scene: s, dataset: d });
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  importFile: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const content = await file.text();
      let raw;
      if (file.name.endsWith('.json')) {
        const parsed: unknown = JSON.parse(content);
        // Auto-detect format
        if (Array.isArray(parsed)) {
          // Spotify extended history
          raw = await new SpotifyExportAdapter().load(content);
        } else if (isSpotifyProfileSnapshot(parsed)) {
          // Spotify profile snapshot (from this app's export or NewsletterAI)
          raw = new SpotifyProfileSnapshotAdapter().convert(parsed as SpotifyProfileSnapshot);
        } else {
          // stats.fm JSON export
          raw = await new StatsFmImportAdapter().load(content);
        }
      } else {
        throw new Error('Unsupported file type. Use a JSON export from stats.fm or Spotify.');
      }
      const { scene, dataset } = await buildScene(raw, 'album');
      set({ rawData: raw, dataset, scene, albumImages: new Map(), isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadFromStatsFm: async (apiData: StatsFmApiData) => {
    set({ isLoading: true, error: null });
    try {
      const albumImages = extractAlbumImages(apiData);
      const raw = new StatsFmApiAdapter().convert(apiData);
      const { scene, dataset } = await buildScene(raw, 'album');
      set({ rawData: raw, dataset, scene, albumImages, isLoading: false });
      void enrichWithLastFm(dataset, raw, 'album', ({ scene: s, dataset: d }) => {
        set({ scene: s, dataset: d });
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  loadFromSpotifyProfile: async (snapshot: SpotifyProfileSnapshot) => {
    set({ isLoading: true, error: null });
    try {
      const raw = new SpotifyProfileSnapshotAdapter().convert(snapshot);
      const { scene, dataset } = await buildScene(raw, 'album');
      set({ rawData: raw, dataset, scene, albumImages: new Map(), isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  recomputeScene: (viewMode: ViewMode) => {
    const { rawData } = get();
    if (!rawData) return;
    void buildScene(rawData, viewMode).then(({ scene, dataset }) => set({ scene, dataset }));
  },
}));
