/**
 * stats.fm API client with localStorage caching.
 *
 * Response format from statsfm.js SDK (source of truth):
 *   - Single resource: { item: { ... } }
 *   - List resource:   { items: [ ... ] }
 *   - Error:           { message: string, path: string, code: string }
 *
 * Top ranking items shape: { position, streams, playedMs, indicator, artist|track|album }
 * NOTE: "streams" = play count, "playedMs" = total milliseconds listened.
 *
 * API reference: https://api.stats.fm/api/v1
 */

const BASE = 'https://api.stats.fm/api/v1';
const CACHE_KEY = 'cosmos_statsfm_v2';   // v2 to invalidate old cache with wrong field names
const TTL_MS = 24 * 60 * 60 * 1000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface StatsFmArtist {
  id: number;
  name: string;
  genres: string[];
  image?: string;
}

export interface StatsFmAlbum {
  id: number;
  name: string;
  image?: string;
  releaseDate?: string;
}

export interface StatsFmTrack {
  id: number;
  name: string;
  durationMs: number;
  artists: StatsFmArtist[];
  albums: StatsFmAlbum[];
}

// Actual shape returned by /top/artists, /top/tracks, /top/albums endpoints:
// { position, streams (= play count), playedMs (= total ms), indicator, artist|track|album }
export interface StatsFmTopArtist {
  position: number;
  streams: number;    // play count
  playedMs: number;   // total milliseconds listened
  indicator: number | null;
  artist: StatsFmArtist;
}

export interface StatsFmTopTrack {
  position: number;
  streams: number;
  playedMs: number;
  indicator: number | null;
  track: StatsFmTrack;
}

export interface StatsFmTopAlbum {
  position: number;
  streams: number;
  playedMs: number;
  indicator: number | null;
  album: StatsFmAlbum;
}

export interface StatsFmStream {
  endTime: string;
  track: StatsFmTrack;
  playedMs: number;
}

export interface StatsFmUser {
  id: string;
  customId: string;
  displayName: string;
  image?: string;
  isPlus?: boolean;
  privacySettings?: Record<string, unknown>;
}

export interface StatsFmData {
  user: StatsFmUser;
  topArtists: StatsFmTopArtist[];
  topTracks: StatsFmTopTrack[];
  // topAlbums removed — album info is embedded in each track, no separate fetch needed
  recentStreams: StatsFmStream[];
  fetchedAt: number;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

export function getCachedData(): StatsFmData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StatsFmData;
    if (Date.now() - data.fetchedAt > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

export function getCachedUsername(): string | null {
  return getCachedData()?.user.customId ?? null;
}

function saveCache(data: StatsFmData): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* storage full */ }
}

// ── API fetcher ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    let apiMessage = '';
    try {
      const body = await res.json() as { message?: string; code?: string };
      apiMessage = body.message ?? '';
    } catch { /* non-JSON error body */ }

    const msg =
      res.status === 404
        ? `User not found — check the username spelling (${path})`
        : res.status === 401 || res.status === 403
          ? 'Profile is private — go to stats.fm → Settings → Profile → set visibility to Public'
          : `stats.fm error ${res.status} on ${path}${apiMessage ? `: ${apiMessage}` : ''}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export interface FetchProgress {
  step: string;
  total: number;
  done: number;
}

export async function fetchStatsFmData(
  username: string,
  onProgress?: (p: FetchProgress) => void,
  forceRefresh = false,
): Promise<StatsFmData> {
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached && cached.user.customId.toLowerCase() === username.toLowerCase()) {
      return cached;
    }
  }

  // topAlbums removed: the endpoint returns 400 with range=lifetime,
  // and album info is already embedded in each track object — no separate fetch needed.
  const steps = ['User profile', 'Top artists', 'Top tracks', 'Recent streams'];
  let done = 0;
  const progress = (step: string) => { done++; onProgress?.({ step, total: steps.length, done }); };

  // 1. User profile
  progress(steps[0]!);
  const userRes = await apiFetch<{ item: StatsFmUser }>(`/users/${username}`);
  const user = userRes.item;
  const uid = user.customId;

  // 2. Top artists (lifetime)
  progress(steps[1]!);
  const artistsRes = await apiFetch<{ items: StatsFmTopArtist[] }>(
    `/users/${uid}/top/artists?range=lifetime&limit=50`,
  );

  // 3. Top tracks (lifetime)
  progress(steps[2]!);
  const tracksRes = await apiFetch<{ items: StatsFmTopTrack[] }>(
    `/users/${uid}/top/tracks?range=lifetime&limit=100`,
  );

  // 4. Recent streams — /streams (no /recent suffix in v1 API)
  progress(steps[3]!);
  const streamsRes = await apiFetch<{ items: StatsFmStream[] }>(
    `/users/${uid}/streams?limit=100`,
  );

  const data: StatsFmData = {
    user,
    topArtists: artistsRes.items,
    topTracks:  tracksRes.items,
    recentStreams: streamsRes.items,
    fetchedAt: Date.now(),
  };

  saveCache(data);
  return data;
}
