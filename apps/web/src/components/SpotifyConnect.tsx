import { useState, useCallback, useEffect } from 'react';
import { CloseIcon } from '@music-cosmos/ui';
import {
  initiateSpotifyLogin,
  getStoredClientId,
  storeClientId,
  isSpotifyConnected,
  getSpotifyDisplayName,
  getSpotifyAvatarUrl,
  disconnectSpotify,
  getRedirectUri,
} from '../lib/spotifyAuth.js';
import { fetchSpotifyProfileSnapshot, type FetchProgress } from '../lib/spotifyApiClient.js';
import { getAccessToken } from '../lib/spotifyAuth.js';
import type { SpotifyProfileSnapshot } from '@music-cosmos/data-adapters';

interface SpotifyConnectProps {
  onData: (snapshot: SpotifyProfileSnapshot) => Promise<void>;
}

type Status = 'idle' | 'setup' | 'loading' | 'connected' | 'error';

export function SpotifyConnect({ onData }: SpotifyConnectProps) {
  const [clientId, setClientId] = useState(getStoredClientId() ?? '');
  const [status, setStatus] = useState<Status>(isSpotifyConnected() ? 'connected' : 'idle');
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [error, setError] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [displayName] = useState(getSpotifyDisplayName());
  const [avatarUrl]   = useState(getSpotifyAvatarUrl());

  useEffect(() => {
    setRedirectUri(getRedirectUri());
  }, []);

  // If we just came back from OAuth (token is fresh), auto-fetch data
  useEffect(() => {
    const token = getAccessToken();
    if (!token || status === 'connected') return;
    void handleFetch(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback(() => {
    const id = clientId.trim();
    if (!id) return;
    storeClientId(id);
    void initiateSpotifyLogin(id);  // redirects the page
  }, [clientId]);

  const handleFetch = useCallback(async (token: string) => {
    setStatus('loading');
    setError('');
    setProgress(null);
    try {
      const snapshot = await fetchSpotifyProfileSnapshot(token, setProgress);
      setStatus('connected');
      await onData(snapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [onData]);

  const handleRefresh = useCallback(() => {
    const token = getAccessToken();
    if (token) void handleFetch(token);
    else {
      disconnectSpotify();
      setStatus('idle');
    }
  }, [handleFetch]);

  const handleDisconnect = useCallback(() => {
    disconnectSpotify();
    setStatus('idle');
  }, []);

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1DB954" aria-hidden>
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>Spotify</span>
        {status === 'connected' && (
          <span style={{ fontSize: 9, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 7px', borderRadius: 10, letterSpacing: 0.5 }}>
            Connected
          </span>
        )}
      </div>

      {/* Connected state */}
      {status === 'connected' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 7, marginBottom: 10 }}>
            {avatarUrl && <img src={avatarUrl} alt="" width={24} height={24} style={{ borderRadius: '50%', flexShrink: 0 }} />}
            <div>
              <div style={{ fontSize: 11, color: '#e2e8f0' }}>{displayName ?? 'Spotify account'}</div>
              <div style={{ fontSize: 9, color: '#334155' }}>Top artists from 3 time ranges + followed</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="ui-pill-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={handleRefresh}>
              Refresh data
            </button>
            <button style={secondaryBtnStyle} onClick={handleDisconnect} aria-label="Disconnect Spotify">
              <CloseIcon size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {status === 'loading' && progress && (
        <div>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, marginBottom: 8 }}>
            <div style={{
              height: '100%',
              width: `${Math.round((progress.done / progress.total) * 100)}%`,
              background: '#1DB954',
              borderRadius: 1,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#475569' }}>{progress.step}…</div>
        </div>
      )}

      {/* Setup / idle state */}
      {(status === 'idle' || status === 'setup' || status === 'error') && (
        <>
          <p style={{ fontSize: 10, color: '#334155', margin: '0 0 10px', lineHeight: 1.55 }}>
            Login with your Spotify account. Reads your top artists and followed artists — no playback access.
          </p>

          {/* Client ID input */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 4 }}>
              Spotify Client ID
            </label>
            <input
              style={inputStyle}
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder="Paste your Client ID here"
              spellCheck={false}
              autoCapitalize="none"
              aria-label="Spotify Client ID"
            />
          </div>

          {/* Redirect URI — must match EXACTLY what's registered */}
          {redirectUri && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 4 }}>
                Redirect URI — register this EXACTLY in Spotify Dashboard
              </label>
              <RedirectUriBox uri={redirectUri} />
              <div style={{ fontSize: 9, color: '#334155', marginTop: 5, lineHeight: 1.5 }}>
                ⚠ Codespaces URL changes each session — update it in the Dashboard if you get a redirect_uri error.
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div style={{ padding: '7px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, marginBottom: 8, fontSize: 10, color: '#fca5a5', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <button
            className="ui-pill-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleConnect}
            disabled={!clientId.trim()}
          >
            Connect with Spotify
          </button>

          {/* Setup instructions */}
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 9, color: '#334155', cursor: 'pointer', letterSpacing: 0.5 }}>
              How to get a Client ID (free, 2 min)
            </summary>
            <ol style={{ margin: '8px 0 0', paddingLeft: 16 }}>
              {SETUP_STEPS.map((step, i) => (
                <li key={i} style={{ fontSize: 9, color: '#1e293b', marginBottom: 4, lineHeight: 1.5 }}>{step}</li>
              ))}
            </ol>
          </details>
        </>
      )}
    </div>
  );
}

const SETUP_STEPS = [
  'Go to developer.spotify.com/dashboard → Create app',
  'App name and description: anything (e.g. "My Music Cosmos")',
  'Redirect URI: copy the URI shown above and paste it exactly',
  'Check "Web API" → Save',
  'Copy the Client ID from the app settings page',
  'Paste it in the field above and click Connect',
];

const cardStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 7,
  padding: '7px 10px',
  color: '#e2e8f0',
  fontSize: 11,
  outline: 'none',
  boxSizing: 'border-box',
};

function RedirectUriBox({ uri }: { uri: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: copied ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 6, padding: '7px 10px',
        cursor: 'pointer', overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
      onClick={copy}
      title="Click to copy"
    >
      <span style={{ color: '#94a3b8', fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
        {uri}
      </span>
      <span style={{ fontSize: 9, color: copied ? '#34d399' : '#475569', flexShrink: 0 }}>
        {copied ? '✓ copied' : 'copy'}
      </span>
    </div>
  );
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: 'none',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 7,
  color: '#334155',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};
