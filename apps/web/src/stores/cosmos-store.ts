import { create } from 'zustand';
import type { RawMusicData, MusicDataset } from '@music-cosmos/domain';
import type { ViewMode } from '@music-cosmos/config';
import type { VisualScene } from '@music-cosmos/layout-engine';
import { MockDataAdapter, StatsFmImportAdapter, SpotifyExportAdapter } from '@music-cosmos/data-adapters';
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
  loadMockData: () => Promise<void>;
  importFile: (file: File) => Promise<void>;
  recomputeScene: (viewMode: ViewMode) => void;
}

async function buildScene(raw: RawMusicData, viewMode: ViewMode): Promise<VisualScene> {
  const dataset = normalize(raw);
  const graph = mapDatasetToCosmicGraph(dataset, dataset.stats, defaultVisualRules, defaultRenderBudget, viewMode);
  return computeLayout(graph, defaultLayoutConfig, defaultRenderBudget, viewMode);
}

export const useCosmosStore = create<CosmosState>((set, get) => ({
  rawData: null,
  dataset: null,
  scene: null,
  isLoading: false,
  error: null,

  loadMockData: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await new MockDataAdapter().load();
      const scene = await buildScene(raw, 'universe');
      set({ rawData: raw, scene, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  importFile: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const content = await file.text();
      let adapter;
      if (file.name.endsWith('.json')) {
        const parsed: unknown = JSON.parse(content);
        if (Array.isArray(parsed)) {
          adapter = new SpotifyExportAdapter();
        } else {
          adapter = new StatsFmImportAdapter();
        }
      } else {
        throw new Error('Unsupported file type. Please use a JSON export from stats.fm or Spotify.');
      }
      const raw = await adapter.load(content);
      const scene = await buildScene(raw, 'universe');
      set({ rawData: raw, scene, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  recomputeScene: (viewMode: ViewMode) => {
    const { rawData } = get();
    if (!rawData) return;
    void buildScene(rawData, viewMode).then((scene) => set({ scene }));
  },
}));
