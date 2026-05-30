import { describe, it, expect } from 'vitest';
import { StatsFmApiAdapter } from './StatsFmApiAdapter.js';
import type { StatsFmApiData } from './StatsFmApiAdapter.js';

// Minimal test fixture matching the real stats.fm API structure
const FIXTURE: StatsFmApiData = {
  user: { customId: 'testuser' },
  topArtists: [
    {
      position: 1,
      streams: null,    // null = no imported history (common case)
      artist: {
        id: 779,
        name: 'Coldplay',
        genres: ['alternative', 'pop'],
        image: 'https://example.com/coldplay.jpg',
      },
    },
    {
      position: 2,
      streams: null,
      artist: {
        id: 14591,
        name: 'Mili',
        genres: ['anime'],
      },
    },
  ],
  topTracks: [
    {
      position: 1,
      streams: null,
      track: {
        id: 1645684,
        name: 'The Scientist',
        durationMs: 309000,
        artists: [{ id: 779, name: 'Coldplay', image: 'https://example.com/coldplay.jpg' }],
        albums: [{ id: 100, name: 'A Rush of Blood to the Head' }],
      },
    },
    {
      position: 2,
      streams: null,
      track: {
        id: 9999999,
        name: 'Orpheus in the Underworld',
        durationMs: 240000,
        artists: [{ id: 14591, name: 'Mili' }],
        albums: [{ id: 200, name: 'Mag Mell' }],
      },
    },
  ],
  recentStreams: [
    {
      id: 'stream-001',
      endTime: '2026-05-29T21:17:00.000Z',
      playedMs: 181893,
      trackId: 1645684,   // matches topTracks[0].track.id
      trackName: 'The Scientist',
      albumId: 100,
      artistIds: [779],   // matches topArtists[0].artist.id
    },
    {
      id: 'stream-002',
      endTime: '2026-05-29T20:00:00.000Z',
      playedMs: 240000,
      trackId: 99999998,  // NOT in topTracks → partial event
      trackName: 'Unknown Track',
      albumId: 300,
      artistIds: [99999], // NOT in topArtists → artist unresolvable
    },
    {
      id: 'stream-003',
      endTime: '2026-05-28T18:00:00.000Z',
      playedMs: 200000,
      trackId: 9999999,   // matches by ID
      trackName: 'Orpheus in the Underworld',
      albumId: 200,
      artistIds: [14591],
    },
  ],
  fetchedAt: new Date('2026-05-30T00:00:00Z').getTime(),
};

describe('StatsFmApiAdapter', () => {
  const adapter = new StatsFmApiAdapter();
  const result = adapter.convert(FIXTURE);

  // ── INVARIANT: never create synthetic events ──────────────────────────────
  it('syntheticEventsCreated MUST be 0', () => {
    expect(result.importDiagnostics?.syntheticEventsCreated).toBe(0);
  });

  it('does NOT produce events from topTracks or topArtists rankings', () => {
    // topTracks has 2 items; if synthetics were created we'd have more events
    // than recentStreams. We must have at most recentStreams.length events.
    expect(result.events.length).toBeLessThanOrEqual(FIXTURE.recentStreams.length);
  });

  it('does NOT use Math.random() in ranking conversion', () => {
    // Run twice — same input must produce identical event count
    const r1 = adapter.convert(FIXTURE);
    const r2 = adapter.convert(FIXTURE);
    expect(r1.events.length).toBe(r2.events.length);
    // Event timestamps must come from real stream endTime, not random dates
    for (let i = 0; i < r1.events.length; i++) {
      expect(r1.events[i]?.playedAt.toISOString()).toBe(r2.events[i]?.playedAt.toISOString());
    }
  });

  // ── Real events from recentStreams ────────────────────────────────────────
  it('converts all recentStreams into events (none dropped)', () => {
    expect(result.events.length).toBe(FIXTURE.recentStreams.length);
  });

  it('resolves artistName for stream matched by trackId', () => {
    const stream001 = result.events.find(
      (e) => e.playedAt.toISOString() === '2026-05-29T21:17:00.000Z',
    );
    expect(stream001).toBeDefined();
    expect(stream001?.artistName).toBe('Coldplay');
    expect(stream001?.resolutionStatus).toBe('resolved');
  });

  it('preserves partial event when artist cannot be resolved', () => {
    const stream002 = result.events.find(
      (e) => e.playedAt.toISOString() === '2026-05-29T20:00:00.000Z',
    );
    expect(stream002).toBeDefined();
    expect(stream002?.artistName).toBeUndefined();
    expect(stream002?.resolutionStatus).toBe('partial');
    expect(stream002?.trackTitle).toBe('Unknown Track');
  });

  it('uses real timestamps from stream endTime', () => {
    const timestamps = result.events.map((e) => e.playedAt.toISOString());
    expect(timestamps).toContain('2026-05-29T21:17:00.000Z');
    expect(timestamps).toContain('2026-05-29T20:00:00.000Z');
    expect(timestamps).toContain('2026-05-28T18:00:00.000Z');
  });

  it('uses real playedMs duration from stream', () => {
    const e = result.events.find((ev) => ev.trackTitle === 'The Scientist');
    expect(e?.durationPlayedMs).toBe(181893);   // from stream.playedMs
  });

  // ── ProfileSignals from rankings ──────────────────────────────────────────
  it('creates ProfileSignal for each topArtist', () => {
    const artistSignals = (result.profileSignals ?? []).filter(
      (s) => s.kind === 'statsfm-top-artist',
    );
    expect(artistSignals.length).toBe(FIXTURE.topArtists.length);
  });

  it('creates ProfileSignal for each topTrack', () => {
    const trackSignals = (result.profileSignals ?? []).filter(
      (s) => s.kind === 'statsfm-top-track',
    );
    expect(trackSignals.length).toBe(FIXTURE.topTracks.length);
  });

  it('ProfileSignal has affinityScore, not streamCount as affinity', () => {
    const coldplaySignal = (result.profileSignals ?? []).find(
      (s) => s.artistName === 'Coldplay' && s.kind === 'statsfm-top-artist',
    );
    expect(coldplaySignal?.affinityScore).toBeGreaterThan(0);
    // streams=null in fixture → streamCount must be undefined, not 0
    expect(coldplaySignal?.streamCount).toBeUndefined();
  });

  it('ProfileSignal.position reflects API ranking position', () => {
    const coldplay = (result.profileSignals ?? []).find(
      (s) => s.artistName === 'Coldplay' && s.kind === 'statsfm-top-artist',
    );
    const mili = (result.profileSignals ?? []).find(
      (s) => s.artistName === 'Mili' && s.kind === 'statsfm-top-artist',
    );
    expect(coldplay?.position).toBe(1);
    expect(mili?.position).toBe(2);
    // Position 1 must have higher affinity than position 2
    expect((coldplay?.affinityScore ?? 0)).toBeGreaterThan(mili?.affinityScore ?? 0);
  });

  // ── GenreEvidence propagation ─────────────────────────────────────────────
  it('attaches genreEvidence from topArtists to resolved streams', () => {
    const coldplayStream = result.events.find((e) => e.artistName === 'Coldplay');
    expect(coldplayStream?.genreEvidence).toBeDefined();
    expect(coldplayStream?.genreEvidence?.length).toBeGreaterThan(0);
    expect(coldplayStream?.genreEvidence?.[0]?.source).toBe('statsfm');
  });

  // ── DataQualityReport ─────────────────────────────────────────────────────
  it('generates DataQualityReport', () => {
    expect(result.importDiagnostics).toBeDefined();
  });

  it('DataQualityReport.warnings mentions streams=null', () => {
    const warnings = result.importDiagnostics?.warnings ?? [];
    const hasNullWarning = warnings.some((w) => w.includes('streams=null'));
    expect(hasNullWarning).toBe(true);
  });

  it('rawEvents count matches recentStreams length', () => {
    expect(result.importDiagnostics?.rawEvents).toBe(FIXTURE.recentStreams.length);
  });
});
