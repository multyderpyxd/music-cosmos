import { describe, it, expect } from 'vitest';
import { aggregateStats } from './metricsAggregator.js';
import { artistId, genreId, trackId } from '@music-cosmos/domain';
import type { ListeningEvent, Artist, Track, Genre } from '@music-cosmos/domain';

const now = new Date();
function daysAgo(n: number): Date {
  return new Date(now.getTime() - n * 86_400_000);
}

const gElectronic = genreId('g:electronic');
const aId = artistId('a:burial');
const tId = trackId('t:archangel');

const genre: Genre = { id: gElectronic, name: 'Electronic', aliases: [], externalIds: {} };
const artist: Artist = {
  id: aId, name: 'Burial', normalizedName: 'burial',
  primaryGenreId: gElectronic, genreIds: [gElectronic],
  aliases: [], externalIds: {}, isUnknown: false,
};
const track: Track = {
  id: tId, title: 'Archangel', artistId: aId, albumId: undefined,
  durationMs: 215_000, genreIds: [gElectronic], externalIds: {}, isUnknown: false,
};

const events: ListeningEvent[] = [
  { id: 'e1', trackId: tId, artistId: aId, playedAt: daysAgo(5),  durationPlayedMs: 215_000, sourceAdapter: 'mock' },
  { id: 'e2', trackId: tId, artistId: aId, playedAt: daysAgo(20), durationPlayedMs: 215_000, sourceAdapter: 'mock' },
  { id: 'e3', trackId: tId, artistId: aId, playedAt: daysAgo(60), durationPlayedMs: 215_000, sourceAdapter: 'mock' },
  { id: 'e4', trackId: tId, artistId: aId, playedAt: daysAgo(400), durationPlayedMs: 215_000, sourceAdapter: 'mock' },
];

describe('aggregateStats', () => {
  const stats = aggregateStats(
    events,
    new Map([[gElectronic, genre]]),
    new Map([[aId, artist]]),
    new Map(),
    new Map([[tId, track]]),
  );

  it('counts total plays per track', () => {
    expect(stats.get(String(tId))?.totalPlays).toBe(4);
  });

  it('counts playsLast30Days correctly (2 events within 30 days)', () => {
    expect(stats.get(String(tId))?.playsLast30Days).toBe(2);
  });

  it('counts playsLast90Days correctly (3 events within 90 days)', () => {
    expect(stats.get(String(tId))?.playsLast90Days).toBe(3);
  });

  it('counts playsLast365Days correctly (3 events within 365 days)', () => {
    expect(stats.get(String(tId))?.playsLast365Days).toBe(3);
  });

  it('aggregates artist stats matching track plays', () => {
    expect(stats.get(String(aId))?.totalPlays).toBe(4);
  });

  it('aggregates genre stats matching artist plays', () => {
    expect(stats.get(String(gElectronic))?.totalPlays).toBe(4);
  });

  it('calculates totalMinutes', () => {
    const expectedMinutes = (4 * 215_000) / 60_000;
    expect(stats.get(String(tId))?.totalMinutes).toBeCloseTo(expectedMinutes);
  });

  it('tracks firstPlayedAt and lastPlayedAt', () => {
    const s = stats.get(String(tId));
    expect(s?.firstPlayedAt.getTime()).toBeLessThan(s?.lastPlayedAt.getTime() ?? 0);
  });
});
