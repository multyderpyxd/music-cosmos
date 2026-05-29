import type { ListeningStats } from '@music-cosmos/domain';
import type { VisualRules, StarVisualRule, PlanetVisualRule, SatelliteVisualRule } from '@music-cosmos/config';
import { scaleByMethod, recencyDecay } from '@music-cosmos/config';
import type { VisualProps } from '../types/CosmicTypes.js';

export interface StatRange {
  min: number;
  max: number;
}

export function makeGalaxyProps(
  stats: ListeningStats,
  range: StatRange,
  rules: VisualRules,
  colorIndex: number,
): VisualProps {
  const { galaxy } = rules;
  const value = galaxy.sizeMetric === 'totalMinutes' ? stats.totalMinutes : stats.totalPlays;
  const size = scaleByMethod(galaxy.scale, value, range.min, range.max, galaxy.minSize, galaxy.maxSize);
  const palette = rules.colorPalettes[galaxy.colorPaletteId] ?? ['#6B48FF'];
  const hex = palette[colorIndex % palette.length] ?? '#6B48FF';
  return {
    size,
    brightness: 0.8,
    color: hexToRgb(hex),
    mass: size / galaxy.maxSize,
  };
}

export function makeStarProps(
  stats: ListeningStats,
  range: StatRange,
  rules: VisualRules,
  colorIndex: number,
  now: Date = new Date(),
): VisualProps {
  const { star } = rules as { star: StarVisualRule };
  const value = star.sizeMetric === 'totalMinutes' ? stats.totalMinutes : stats.totalPlays;
  const size = scaleByMethod(star.scale, value, range.min, range.max, star.minSize, star.maxSize);
  const recentPlays =
    star.brightnessMetric === 'playsLast30Days' ? stats.playsLast30Days : stats.playsLast90Days;
  const decay = recencyDecay(stats.lastPlayedAt, now, 30);
  const brightness = Math.min(1, 0.3 + 0.7 * decay) * Math.min(1, recentPlays / 10 + 0.2);
  const palette = rules.colorPalettes[star.colorPaletteId] ?? ['#FFF9C4'];
  const hex = palette[colorIndex % palette.length] ?? '#FFF9C4';
  return {
    size,
    brightness: Math.max(0.2, Math.min(1, brightness)),
    color: hexToRgb(hex),
    mass: size / star.maxSize,
  };
}

export function makePlanetProps(
  stats: ListeningStats,
  sizeRange: StatRange,
  rules: VisualRules,
  releaseYear: number | undefined,
  now: Date = new Date(),
): VisualProps {
  const { planet } = rules as { planet: PlanetVisualRule };
  const value = planet.sizeMetric === 'totalMinutes' ? stats.totalMinutes : stats.totalPlays;
  const size = scaleByMethod(planet.scale, value, sizeRange.min, sizeRange.max, planet.minSize, planet.maxSize);
  const currentYear = now.getFullYear();
  const age = releaseYear !== undefined ? Math.max(0, currentYear - releaseYear) : 20;
  const orbitRadius = scaleByMethod('linear', age, 0, 40, planet.minOrbitRadius, planet.maxOrbitRadius);
  const orbitSpeed = scaleByMethod('sqrt', stats.playsLast90Days, 0, 50, planet.minOrbitSpeed, planet.maxOrbitSpeed);
  return {
    size,
    brightness: 0.6,
    color: [0.4, 0.6, 0.9],
    mass: size / planet.maxSize,
    orbitRadius,
    orbitSpeed,
  };
}

export function makeSatelliteProps(
  stats: ListeningStats,
  sizeRange: StatRange,
  parentAlbumStats: ListeningStats,
  rules: VisualRules,
  now: Date = new Date(),
): VisualProps {
  const { satellite } = rules as { satellite: SatelliteVisualRule };
  const size = scaleByMethod(satellite.scale, stats.totalPlays, sizeRange.min, sizeRange.max, satellite.minSize, satellite.maxSize);
  const affinity = parentAlbumStats.totalPlays > 0 ? stats.totalPlays / parentAlbumStats.totalPlays : 0;
  const orbitRadius = scaleByMethod('linear', 1 - affinity, 0, 1, satellite.minOrbitRadius, satellite.maxOrbitRadius);
  const brightness = recencyDecay(stats.lastPlayedAt, now, 14);
  return {
    size,
    brightness: Math.max(0.1, brightness),
    color: [0.9, 0.9, 0.95],
    mass: size / satellite.maxSize,
    orbitRadius,
    orbitSpeed: 0.5 + affinity * 2,
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [
    parseInt(result[1] ?? 'ff', 16) / 255,
    parseInt(result[2] ?? 'ff', 16) / 255,
    parseInt(result[3] ?? 'ff', 16) / 255,
  ];
}
