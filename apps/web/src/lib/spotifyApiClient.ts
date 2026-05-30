/**
 * Spotify Web API client — fetches profile data using an access token.
 * Uses the SpotifyProfileSnapshot format compatible with SpotifyProfileSnapshotAdapter.
 */

import type { SpotifyProfileSnapshot, SpotifyProfileTopArtist, SpotifyProfileFollowedArtist } from '@music-cosmos/data-adapters';

const BASE = 'https://api.spotify.com/v1';

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: Array<{ url: string; height: number; width: number }>;
}

interface TopArtistsResponse {
  items: SpotifyArtist[];
  next: string | null;
}

interface FollowedArtistsResponse {
  artists: {
    items: SpotifyArtist[];
    next: string | null;
    cursors?: { after?: string };
  };
}

async function apiFetch<T>(endpoint: string, token: string): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    const after = Number(res.headers.get('Retry-After') ?? '3');
    await new Promise((r) => setTimeout(r, after * 1000));
    return apiFetch(url, token);
  }
  if (!res.ok) throw new Error(`Spotify API ${res.status}: ${endpoint}`);
  return res.json() as Promise<T>;
}

/** Fetch top 50 artists for a single time range. */
async function fetchTopArtistsTerm(
  token: string,
  term: 'short_term' | 'medium_term' | 'long_term',
): Promise<SpotifyProfileTopArtist[]> {
  const data = await apiFetch<TopArtistsResponse>(
    `/me/top/artists?time_range=${term}&limit=50`,
    token,
  );
  return (data.items ?? []).map((artist, idx) => ({
    term,
    position: idx + 1,
    id: artist.id,
    name: artist.name,
    genres: artist.genres,
    popularity: artist.popularity,
    imageUrl: artist.images[0]?.url,
  }));
}

/** Fetch all followed artists (paginated, max 200 to keep it practical). */
async function fetchFollowedArtists(token: string): Promise<SpotifyProfileFollowedArtist[]> {
  const followed: SpotifyProfileFollowedArtist[] = [];
  let after: string | undefined;

  while (followed.length < 200) {
    const url = `/me/following?type=artist&limit=50${after ? `&after=${after}` : ''}`;
    const data = await apiFetch<FollowedArtistsResponse>(url, token);
    const { items, cursors } = data.artists;

    for (const artist of items) {
      followed.push({
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        imageUrl: artist.images[0]?.url,
      });
    }

    if (!cursors?.after || items.length === 0) break;
    after = cursors.after;
  }

  return followed;
}

export interface FetchProgress {
  step: string;
  done: number;
  total: number;
}

/**
 * Fetches all profile data and returns a SpotifyProfileSnapshot
 * ready for SpotifyProfileSnapshotAdapter.convert().
 */
export async function fetchSpotifyProfileSnapshot(
  token: string,
  onProgress?: (p: FetchProgress) => void,
): Promise<SpotifyProfileSnapshot> {
  const steps = [
    'Top artists (recent)',
    'Top artists (6 months)',
    'Top artists (lifetime)',
    'Followed artists',
  ];
  let done = 0;
  const progress = (step: string) => {
    done++;
    onProgress?.({ step, done, total: steps.length });
  };

  progress(steps[0]!);
  const short  = await fetchTopArtistsTerm(token, 'short_term');

  progress(steps[1]!);
  const medium = await fetchTopArtistsTerm(token, 'medium_term');

  progress(steps[2]!);
  const long   = await fetchTopArtistsTerm(token, 'long_term');

  progress(steps[3]!);
  const followedArtists = await fetchFollowedArtists(token);

  return {
    importedAt:      new Date().toISOString(),
    topArtists:      [...short, ...medium, ...long],
    followedArtists,
  };
}
