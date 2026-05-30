/**
 * stats.fm API client — types verified against real API responses.
 *
 * Key findings from live API inspection:
 *   - item.streams is NULL when user has no imported history (use position rank instead)
 *   - /streams items have flat fields (trackName string, artistIds number[]) — NO nested track object
 *   - track.artists[] has id/name/image but NO genres; genres only in topArtists.artist.genres
 *   - privacySettings.{topTracks, streams, ...} are booleans
 */

const BASE = 'https://api.stats.fm/api/v1';
const CACHE_KEY = 'cosmos_statsfm_v3';
const TTL_MS = 24 * 60 * 60 * 1000;

// ── Real API types ────────────────────────────────────────────────────────────

export interface StatsFmUser {
  id: string;
  customId: string;
  displayName: string;
  image?: string;
  isPlus?: boolean;
  privacySettings?: {
    profile?: boolean;
    topTracks?: boolean;
    topArtists?: boolean;
    streams?: boolean;
    [key: string]: boolean | undefined;
  };
}

export interface StatsFmArtist {
  id: number;
  name: string;
  genres: string[];          // genres ARE present here
  image?: string;
  followers?: number;
  spotifyPopularity?: number;
}

/** Item in /top/artists response */
export interface StatsFmTopArtist {
  position: number;
  streams: number | null;    // null when no imported history
  indicator: string | null;
  artist: StatsFmArtist;
}

/** Artist reference inside a track — NO genres field */
export interface StatsFmTrackArtist {
  id: number;
  name: string;
  image?: string;
}

export interface StatsFmTrackAlbum {
  id: number;
  name: string;
  image?: string;
}

/** Item in /top/tracks response */
export interface StatsFmTopTrack {
  position: number;
  streams: number | null;
  indicator: string | null;
  track: {
    id: number;
    name: string;
    durationMs: number;
    artists: StatsFmTrackArtist[];   // id + name + image only, no genres
    albums: StatsFmTrackAlbum[];
    explicit?: boolean;
    spotifyPopularity?: number;
  };
}

/** Item in /streams response — FLAT structure, no nested track object */
export interface StatsFmStream {
  id: string;
  userId: string;
  endTime: string;       // ISO 8601
  playedMs: number;
  trackId: number;
  trackName: string;     // direct string field, not nested
  albumId: number;
  artistIds: number[];   // numeric IDs only, no artist names
  contextId?: string;
  importId?: number;
}

export interface StatsFmData {
  user: StatsFmUser;
  topArtists: StatsFmTopArtist[];
  topTracks: StatsFmTopTrack[];
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
  } catch { return null; }
}

export function clearCache(): void { localStorage.removeItem(CACHE_KEY); }

export function getCachedUsername(): string | null {
  return getCachedData()?.user.customId ?? null;
}

function saveCache(data: StatsFmData): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* storage full */ }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    let apiMsg = '';
    try { const b = await res.json() as { message?: string }; apiMsg = b.message ?? ''; } catch { /* ignore */ }
    const msg =
      res.status === 404 ? `User not found (${path})`
      : res.status === 401 || res.status === 403 ? 'Profile is private — set visibility to Public in stats.fm Settings'
      : `stats.fm error ${res.status} on ${path}${apiMsg ? `: ${apiMsg}` : ''}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export interface FetchProgress { step: string; total: number; done: number; }

export async function fetchStatsFmData(
  username: string,
  onProgress?: (p: FetchProgress) => void,
  forceRefresh = false,
): Promise<StatsFmData> {
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached && cached.user.customId.toLowerCase() === username.toLowerCase()) return cached;
  }

  const steps = ['User profile', 'Top artists', 'Top tracks', 'Recent streams'];
  let done = 0;
  const progress = (step: string) => { done++; onProgress?.({ step, total: steps.length, done }); };

  progress(steps[0]!);
  const userRes = await apiFetch<{ item: StatsFmUser }>(`/users/${username}`);
  const user = userRes.item;
  const uid = user.customId;

  progress(steps[1]!);
  const artistsRes = await apiFetch<{ items: StatsFmTopArtist[] }>(
    `/users/${uid}/top/artists?range=lifetime&limit=50`,
  );

  progress(steps[2]!);
  const tracksRes = await apiFetch<{ items: StatsFmTopTrack[] }>(
    `/users/${uid}/top/tracks?range=lifetime&limit=100`,
  );

  progress(steps[3]!);
  const streamsRes = await apiFetch<{ items: StatsFmStream[] }>(
    `/users/${uid}/streams?limit=200`,
  );

  const data: StatsFmData = {
    user,
    topArtists: artistsRes.items ?? [],
    topTracks:  tracksRes.items ?? [],
    recentStreams: streamsRes.items ?? [],
    fetchedAt: Date.now(),
  };

  saveCache(data);
  return data;
}
