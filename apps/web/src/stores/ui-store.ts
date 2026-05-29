import { create } from 'zustand';
import type { ViewMode } from '@music-cosmos/config';

export interface FilterSet {
  minPlays: number;
  genreIds: string[];
  periodFrom?: Date;
  periodTo?: Date;
}

interface UIState {
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  viewMode: ViewMode;
  focusedGalaxyId: string | null;
  focusedStarId: string | null;
  searchQuery: string;
  activeFilters: FilterSet;
  isSidePanelOpen: boolean;
  isTrackingEntity: boolean;
  isPaused: boolean;
  selectEntity: (id: string | null) => void;
  setHoveredEntity: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setFocus: (type: 'galaxy' | 'star' | null, id: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleSidePanel: () => void;
  resetFilters: () => void;
  setTracking: (v: boolean) => void;
  togglePause: () => void;
}

const defaultFilters: FilterSet = { minPlays: 0, genreIds: [] };

export const useUIStore = create<UIState>((set) => ({
  selectedEntityId: null,
  hoveredEntityId: null,
  viewMode: 'universe',
  focusedGalaxyId: null,
  focusedStarId: null,
  searchQuery: '',
  activeFilters: defaultFilters,
  isSidePanelOpen: false,
  isTrackingEntity: false,
  isPaused: false,

  selectEntity: (id) =>
    set({ selectedEntityId: id, isSidePanelOpen: id !== null }),
  setHoveredEntity: (id) => set({ hoveredEntityId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setFocus: (type, id) =>
    set({
      focusedGalaxyId: type === 'galaxy' ? id : null,
      focusedStarId: type === 'star' ? id : null,
    }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleSidePanel: () => set((s) => ({ isSidePanelOpen: !s.isSidePanelOpen })),
  resetFilters: () => set({ activeFilters: defaultFilters }),
  setTracking: (v) => set({ isTrackingEntity: v }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
}));
