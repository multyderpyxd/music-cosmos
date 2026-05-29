export type ViewMode = 'universe' | 'galaxy' | 'artist' | 'album';

export interface UniverseViewBudget {
  readonly maxGalaxies: number;
  readonly maxArtistsPerGalaxy: number;
  readonly showAlbums: false;
  readonly showTracks: false;
}

export interface GalaxyViewBudget {
  readonly maxArtists: number;
  readonly maxPreviewAlbumsPerArtist: number;
  readonly showTracks: false;
}

export interface ArtistViewBudget {
  readonly maxAlbums: number;
  readonly maxTracksPerAlbum: number;
  readonly groupHiddenTracks: true;
}

export interface AlbumViewBudget {
  readonly maxTracks: number;
  readonly groupHiddenTracks: boolean;
}

export interface RenderBudget {
  universe: UniverseViewBudget;
  galaxy: GalaxyViewBudget;
  artist: ArtistViewBudget;
  album: AlbumViewBudget;
}

export const defaultRenderBudget: RenderBudget = {
  universe: {
    maxGalaxies: 24,
    maxArtistsPerGalaxy: 40,
    showAlbums: false,
    showTracks: false,
  },
  galaxy: {
    maxArtists: 120,
    maxPreviewAlbumsPerArtist: 3,
    showTracks: false,
  },
  artist: {
    maxAlbums: 80,
    maxTracksPerAlbum: 8,
    groupHiddenTracks: true,
  },
  album: {
    maxTracks: 80,
    groupHiddenTracks: false,
  },
};
