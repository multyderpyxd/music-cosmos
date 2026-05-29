import { create } from 'zustand';

export interface FilterSet {
  minPlays: number;
  genreIds: string[];
  periodFrom?: Date;
  periodTo?: Date;
}

// When activeEntityTypes is empty → show all types.
// When non-empty → show ONLY the types in the set.
export type CosmicEntityTypeFilter = Set<string>;

interface UIState {
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  searchQuery: string;
  activeFilters: FilterSet;
  isSidePanelOpen: boolean;
  isTrackingEntity: boolean;
  isPaused: boolean;
  activeEntityTypes: CosmicEntityTypeFilter;
  galaxyParticleOpacity: number;
  isImportPanelOpen: boolean;
  selectEntity: (id: string | null) => void;
  setHoveredEntity: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleSidePanel: () => void;
  resetFilters: () => void;
  setTracking: (v: boolean) => void;
  togglePause: () => void;
  toggleEntityType: (type: string) => void;
  setGalaxyParticleOpacity: (v: number) => void;
  toggleImportPanel: () => void;
}

const defaultFilters: FilterSet = { minPlays: 0, genreIds: [] };

export const useUIStore = create<UIState>((set) => ({
  selectedEntityId: null,
  hoveredEntityId: null,
  searchQuery: '',
  activeFilters: defaultFilters,
  isSidePanelOpen: false,
  isTrackingEntity: false,
  isPaused: false,
  activeEntityTypes: new Set(),
  galaxyParticleOpacity: 0.55,
  isImportPanelOpen: false,

  selectEntity: (id) =>
    set({ selectedEntityId: id, isSidePanelOpen: id !== null }),
  setHoveredEntity: (id) => set({ hoveredEntityId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleSidePanel: () => set((s) => ({ isSidePanelOpen: !s.isSidePanelOpen })),
  resetFilters: () => set({ activeFilters: defaultFilters }),
  setTracking: (v) => set({ isTrackingEntity: v }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  toggleEntityType: (type) =>
    set((s) => {
      const next = new Set(s.activeEntityTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { activeEntityTypes: next };
    }),
  setGalaxyParticleOpacity: (v) => set({ galaxyParticleOpacity: v }),
  toggleImportPanel: () => set((s) => ({ isImportPanelOpen: !s.isImportPanelOpen })),
}));
