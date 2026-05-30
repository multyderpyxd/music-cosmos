/**
 * stats.fm API client with localStorage caching.
 *
 * Public profiles do not require authentication.
 * Cache TTL: 24 hours.  Force-refresh: pass forceRefresh=true.
 *
 * API reference: https://api.stats.fm/api/v1
 */

const BASE = 'https://api.stats.fm/api/v1';
const CACHE_KEY = 'cosmos_statsfm_v1';
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

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

export interface StatsFmTopArtist {
  artist: StatsFmArtist;
  playCount: number;
  minutesListened: number;
  streams: number;
}

export interface StatsFmTopTrack {
  track: StatsFmTrack;
  playCount: number;
  minutesListened: number;
}

export interface StatsFmTopAlbum {
  album: StatsFmAlbum;
  playCount: number;
  minutesListened: number;
}

export interface StatsFmStream {
  endTime: string;         // ISO 8601
  track: StatsFmTrack;
  playedMs: number;
}

export interface StatsFmUser {
  id: number;
  customId: string;
  displayName: string;
  image?: string;
  // Note: stats.fm API does not expose a simple isPublic boolean.
  // Access is verified implicitly: if data endpoints return 401/403
  // the apiFetch helper will throw a descriptive error.
}

export interface StatsFmData {
  user: StatsFmUser;
  topArtists: StatsFmTopArtist[];
  topTracks: StatsFmTopTrack[];
  topAlbums: StatsFmTopAlbum[];
  recentStreams: StatsFmStream[];
  fetchedAt: number;
}

// ── Cache ────────────────────────────────────────────────────────────────────

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
  const data = getCachedData();
  return data?.user.customId ?? null;
}

function saveCache(data: StatsFmData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage full — skip cache
  }
}

// ── API fetcher ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const msg =
      res.status === 404
        ? 'User not found — check the username spelling'
        : res.status === 401 || res.status === 403
          ? 'Profile is private — go to stats.fm → Settings → Profile and set visibility to Public'
          : `stats.fm API error ${res.status}`;
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

  const steps = ['User profile', 'Top artists', 'Top tracks', 'Top albums', 'Recent streams'];
  let done = 0;

  function progress(step: string) {
    done++;
    onProgress?.({ step, total: steps.length, done });
  }

  // 1. User profile
  progress(steps[0]!);
  const userRes = await apiFetch<{ item: StatsFmUser }>(`/users/${username}`);
  const user = userRes.item;

  const uid = user.customId;

  // 2. Top artists (lifetime)
  progress(steps[1]!);
  const artistsRes = await apiFetch<{ items: StatsFmTopArtist[] }>(
    `/users/${uid}/top/artists?range=lifetime&limit=100`,
  );

  // 3. Top tracks (lifetime)
  progress(steps[2]!);
  const tracksRes = await apiFetch<{ items: StatsFmTopTrack[] }>(
    `/users/${uid}/top/tracks?range=lifetime&limit=200`,
  );

  // 4. Top albums (lifetime)
  progress(steps[3]!);
  const albumsRes = await apiFetch<{ items: StatsFmTopAlbum[] }>(
    `/users/${uid}/top/albums?range=lifetime&limit=100`,
  );

  // 5. Recent streams
  progress(steps[4]!);
  const streamsRes = await apiFetch<{ items: StatsFmStream[] }>(
    `/users/${uid}/streams/recent?limit=200`,
  );

  const data: StatsFmData = {
    user,
    topArtists: artistsRes.items,
    topTracks:  tracksRes.items,
    topAlbums:  albumsRes.items,
    recentStreams: streamsRes.items,
    fetchedAt: Date.now(),
  };

  saveCache(data);
  return data;
}
