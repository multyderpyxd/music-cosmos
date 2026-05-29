export type ScaleMethod = 'log' | 'sqrt' | 'linear';

export interface GalaxyVisualRule {
  sizeMetric: 'totalPlays' | 'totalMinutes';
  minSize: number;
  maxSize: number;
  scale: ScaleMethod;
  colorPaletteId: string;
}

export interface StarVisualRule {
  sizeMetric: 'totalPlays' | 'totalMinutes';
  minSize: number;
  maxSize: number;
  scale: ScaleMethod;
  brightnessMetric: 'playsLast30Days' | 'playsLast90Days';
  colorPaletteId: string;
}

export interface PlanetVisualRule {
  sizeMetric: 'totalPlays' | 'totalMinutes';
  minSize: number;
  maxSize: number;
  scale: ScaleMethod;
  orbitRadiusMetric: 'releaseAge';
  minOrbitRadius: number;
  maxOrbitRadius: number;
  orbitSpeedMetric: 'playsLast90Days';
  minOrbitSpeed: number;
  maxOrbitSpeed: number;
}

export interface SatelliteVisualRule {
  sizeMetric: 'totalPlays';
  minSize: number;
  maxSize: number;
  scale: ScaleMethod;
  orbitRadiusMetric: 'personalAffinity';
  minOrbitRadius: number;
  maxOrbitRadius: number;
  brightnessMetric: 'playsLast30Days';
  maxVisiblePerAlbumInArtistView: number;
}

export interface VisualRules {
  galaxy: GalaxyVisualRule;
  star: StarVisualRule;
  planet: PlanetVisualRule;
  satellite: SatelliteVisualRule;
  colorPalettes: Record<string, readonly string[]>;
}

export const defaultVisualRules: VisualRules = {
  galaxy: {
    sizeMetric: 'totalMinutes',
    minSize: 80,
    maxSize: 400,
    scale: 'sqrt',
    colorPaletteId: 'nebula',
  },
  star: {
    sizeMetric: 'totalPlays',
    minSize: 1.5,
    maxSize: 18,
    scale: 'log',
    brightnessMetric: 'playsLast30Days',
    colorPaletteId: 'stellar',
  },
  planet: {
    sizeMetric: 'totalPlays',
    minSize: 0.4,
    maxSize: 3.5,
    scale: 'log',
    orbitRadiusMetric: 'releaseAge',
    minOrbitRadius: 8,
    maxOrbitRadius: 60,
    orbitSpeedMetric: 'playsLast90Days',
    minOrbitSpeed: 0.05,
    maxOrbitSpeed: 2.0,
  },
  satellite: {
    sizeMetric: 'totalPlays',
    minSize: 0.1,
    maxSize: 0.8,
    scale: 'sqrt',
    orbitRadiusMetric: 'personalAffinity',
    minOrbitRadius: 1.2,
    maxOrbitRadius: 5.0,
    brightnessMetric: 'playsLast30Days',
    maxVisiblePerAlbumInArtistView: 8,
  },
  colorPalettes: {
    nebula: [
      '#6B48FF', '#9B59B6', '#3498DB', '#1ABC9C',
      '#E91E63', '#FF5722', '#FF9800', '#2196F3',
    ],
    stellar: [
      '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC',
      '#BBDEFB', '#C8E6C9', '#E1BEE7', '#F8BBD9',
    ],
  },
};
