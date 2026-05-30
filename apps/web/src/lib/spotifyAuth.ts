/**
 * Spotify OAuth 2.0 with PKCE — no backend, no client secret.
 *
 * Flow:
 *   1. initiateLogin(clientId)  → redirects to Spotify
 *   2. Spotify redirects back   → URL has ?code=...
 *   3. handleCallback()         → exchanges code for token, stores in localStorage
 *   4. getAccessToken()         → returns valid token or null
 *
 * The user needs a Spotify Developer App at developer.spotify.com
 * with the redirect URI set to window.location.origin.
 */

const SCOPES = 'user-top-read user-follow-read';
const STORAGE = {
  clientId:     'cosmos_spotify_client_id',
  verifier:     'cosmos_spotify_pkce_verifier',
  state:        'cosmos_spotify_pkce_state',
  accessToken:  'cosmos_spotify_access_token',
  refreshToken: 'cosmos_spotify_refresh_token',
  expiresAt:    'cosmos_spotify_token_expires_at',
  displayName:  'cosmos_spotify_display_name',
  avatarUrl:    'cosmos_spotify_avatar_url',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function base64UrlEncode(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function randomString(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

// ── Public API ────────────────────────────────────────────────────────────────

/** The redirect URI this app uses — must be registered in Spotify Developer Dashboard. */
export function getRedirectUri(): string {
  const { origin, pathname } = window.location;
  const cleanPath = pathname.replace(/\/$/, '');
  return origin + (cleanPath || '');
}

export function getStoredClientId(): string | null {
  return localStorage.getItem(STORAGE.clientId);
}

export function storeClientId(id: string): void {
  localStorage.setItem(STORAGE.clientId, id.trim());
}

export function getAccessToken(): string | null {
  const token = localStorage.getItem(STORAGE.accessToken);
  const exp   = Number(localStorage.getItem(STORAGE.expiresAt) ?? '0');
  if (!token || Date.now() >= exp) return null;
  return token;
}

export function isSpotifyConnected(): boolean {
  return getAccessToken() !== null;
}

export function getSpotifyDisplayName(): string | null {
  return localStorage.getItem(STORAGE.displayName);
}

export function getSpotifyAvatarUrl(): string | null {
  return localStorage.getItem(STORAGE.avatarUrl);
}

export function disconnectSpotify(): void {
  Object.values(STORAGE).forEach((k) => localStorage.removeItem(k));
}

/** Step 1: redirect the browser to Spotify's auth page. */
export async function initiateSpotifyLogin(clientId: string): Promise<void> {
  const verifier   = randomString(64);
  const challenge  = base64UrlEncode(new Uint8Array(await sha256(verifier)));
  const state      = randomString(16);

  localStorage.setItem(STORAGE.verifier, verifier);
  localStorage.setItem(STORAGE.state, state);
  storeClientId(clientId);

  const params = new URLSearchParams({
    client_id:             clientId,
    response_type:         'code',
    redirect_uri:          getRedirectUri(),
    scope:                 SCOPES,
    state,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
    show_dialog:           'false',
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface SpotifyUserProfile {
  display_name?: string;
  images?: Array<{ url: string }>;
}

/**
 * Step 3: called on app load — detects the ?code= param Spotify redirects to.
 * Returns true if a token was successfully obtained.
 */
export async function handleSpotifyCallback(): Promise<boolean> {
  const params      = new URLSearchParams(window.location.search);
  const code        = params.get('code');
  const returnedState = params.get('state');
  const verifier    = localStorage.getItem(STORAGE.verifier);
  const storedState = localStorage.getItem(STORAGE.state);
  const clientId    = getStoredClientId();

  if (!code || !verifier || !clientId) return false;
  if (returnedState !== storedState) return false;

  // Remove auth params from URL without reload
  window.history.replaceState({}, '', window.location.pathname);
  localStorage.removeItem(STORAGE.verifier);
  localStorage.removeItem(STORAGE.state);

  // Exchange code for token
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  getRedirectUri(),
      client_id:     clientId,
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) return false;

  const tokenData = await tokenRes.json() as TokenResponse;
  const expiresAt = Date.now() + tokenData.expires_in * 1000;

  localStorage.setItem(STORAGE.accessToken,  tokenData.access_token);
  localStorage.setItem(STORAGE.expiresAt,    String(expiresAt));
  if (tokenData.refresh_token) {
    localStorage.setItem(STORAGE.refreshToken, tokenData.refresh_token);
  }

  // Fetch user profile for display
  try {
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (profileRes.ok) {
      const profile = await profileRes.json() as SpotifyUserProfile;
      if (profile.display_name) localStorage.setItem(STORAGE.displayName, profile.display_name);
      const avatar = profile.images?.[0]?.url;
      if (avatar) localStorage.setItem(STORAGE.avatarUrl, avatar);
    }
  } catch { /* non-critical */ }

  return true;
}
