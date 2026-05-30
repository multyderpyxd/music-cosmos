/**
 * Last.fm genre enrichment — artist.getTopTags
 *
 * Used as FALLBACK when an artist has no genre from stats.fm or Spotify.
 * Results are cached in localStorage (TTL 30 days) to avoid hitting rate limits.
 *
 * API key: last.fm offers free API keys at https://www.last.fm/api/account/create
 * Store it in the browser with setLastFmApiKey(key).
 * Never required — if no key, enrichment is silently skipped.
 *
 * Rate limit: ~5 req/sec for free accounts. We add a per-call delay.
 */

import type { GenreEvidence } from '@music-cosmos/domain';
import { isBlacklistedTag, isContextTag } from '@music-cosmos/normalization';
import { normalizeGenreName } from '@music-cosmos/normalization';

const STORAGE_KEY_PREFIX = 'cosmos_lastfm_tags_v1_';
const API_KEY_STORAGE    = 'cosmos_lastfm_api_key';
const TTL_MS             = 30 * 24 * 60 * 60 * 1000;   // 30 days
const MIN_TAG_COUNT      = 10;   // ignore obscure tags with few votes
const MAX_TAGS_PER_ARTIST = 5;   // take top N tags only
const REQUEST_DELAY_MS   = 250;  // conservative delay between calls

interface LastFmTag {
  name: string;
  count: number;
  url?: string;
}

interface CacheEntry {
  fetchedAt: number;
  tags: LastFmTag[];
}

// ── API key management ────────────────────────────────────────────────────────

export function getLastFmApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE);
}

export function setLastFmApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

export function hasLastFmApiKey(): boolean {
  return !!getLastFmApiKey();
}

// ── Cache ─────────────────────────────────────────────────────────────────────

function cacheKey(artistName: string): string {
  return STORAGE_KEY_PREFIX + artistName.toLowerCase().trim();
}

function readCache(artistName: string): LastFmTag[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(artistName));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.fetchedAt > TTL_MS) return null;
    return entry.tags;
  } catch {
    return null;
  }
}

function writeCache(artistName: string, tags: LastFmTag[]): void {
  try {
    const entry: CacheEntry = { fetchedAt: Date.now(), tags };
    localStorage.setItem(cacheKey(artistName), JSON.stringify(entry));
  } catch { /* storage full — skip */ }
}

// ── API fetch ─────────────────────────────────────────────────────────────────

async function fetchTopTags(artistName: string, apiKey: string): Promise<LastFmTag[]> {
  const params = new URLSearchParams({
    method:     'artist.getTopTags',
    artist:     artistName,
    api_key:    apiKey,
    format:     'json',
    autocorrect: '1',
  });

  const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
  if (!res.ok) return [];

  const data = await res.json() as {
    toptags?: { tag?: Array<{ name: string; count: string | number }> };
    error?: number;
  };

  if (data.error) return [];
  return (data.toptags?.tag ?? []).map((t) => ({
    name:  t.name,
    count: Number(t.count ?? 0),
  }));
}

// ── In-flight deduplication ───────────────────────────────────────────────────

const inFlight = new Map<string, Promise<LastFmTag[]>>();

async function getTagsWithDedup(artistName: string, apiKey: string): Promise<LastFmTag[]> {
  const key = artistName.toLowerCase().trim();
  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = (async () => {
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    const tags = await fetchTopTags(artistName, apiKey);
    inFlight.delete(key);
    return tags;
  })();

  inFlight.set(key, promise);
  return promise;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns GenreEvidence[] from Last.fm top tags for an artist.
 * Returns [] if:
 *   - no API key is set
 *   - artist has no Last.fm page
 *   - all tags are blacklisted/context tags
 *
 * Never throws — failures are silent.
 */
export async function getArtistGenreEvidence(artistName: string): Promise<GenreEvidence[]> {
  const apiKey = getLastFmApiKey();
  if (!apiKey) return [];

  // Check cache first
  const cached = readCache(artistName);
  const rawTags = cached ?? await (async () => {
    try {
      const tags = await getTagsWithDedup(artistName, apiKey);
      writeCache(artistName, tags);
      return tags;
    } catch {
      return [];
    }
  })();

  // Filter and convert to GenreEvidence
  const evidence: GenreEvidence[] = [];
  for (const tag of rawTags.slice(0, 20)) {    // inspect top 20 before filtering
    if (evidence.length >= MAX_TAGS_PER_ARTIST) break;
    if (tag.count < MIN_TAG_COUNT) continue;

    const normalized = normalizeGenreName(tag.name);
    if (!normalized) continue;
    if (isBlacklistedTag(normalized)) continue;
    if (isContextTag(normalized)) continue;    // skip context tags for genre

    evidence.push({
      rawName:        tag.name,
      normalizedName: normalized,
      source:         'lastfm',
      weight:         0.65,
      confidence:     tag.count > 50 ? 0.75 : 0.60,
      count:          tag.count,
    });
  }

  return evidence;
}

/**
 * Bulk enrich a list of artists. Non-blocking — returns results as they arrive.
 * Processes one artist at a time to respect Last.fm rate limit.
 */
export async function enrichArtistsWithLastFm(
  artists: string[],
  onResult?: (artistName: string, evidence: GenreEvidence[]) => void,
): Promise<Map<string, GenreEvidence[]>> {
  const results = new Map<string, GenreEvidence[]>();
  for (const name of artists) {
    const evidence = await getArtistGenreEvidence(name);
    results.set(name, evidence);
    if (evidence.length > 0) onResult?.(name, evidence);
  }
  return results;
}

/** Clears all cached Last.fm data (useful for testing or manual refresh). */
export function clearLastFmCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(STORAGE_KEY_PREFIX)) keysToRemove.push(k);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
