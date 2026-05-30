import { useState, useCallback } from 'react';
import { SearchIcon, CloseIcon } from '@music-cosmos/ui';
import {
  fetchStatsFmData,
  getCachedData,
  clearCache,
  getCachedUsername,
  type FetchProgress,
} from '../lib/statsFmApi.js';
import type { StatsFmApiData } from '@music-cosmos/data-adapters';

interface StatsFmConnectProps {
  onData: (data: StatsFmApiData) => Promise<void>;
  onClose?: () => void;
}

type Status = 'idle' | 'loading' | 'connected' | 'error';

export function StatsFmConnect({ onData, onClose }: StatsFmConnectProps) {
  const cached = getCachedData();
  const [username, setUsername] = useState(getCachedUsername() ?? '');
  const [status, setStatus] = useState<Status>(cached ? 'connected' : 'idle');
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [error, setError] = useState('');
  const [connectedUser, setConnectedUser] = useState(cached?.user.customId ?? '');
  const [cachedAt, setCachedAt] = useState(cached ? new Date(cached.fetchedAt) : null);

  const handleConnect = useCallback(async (forceRefresh = false) => {
    const u = username.trim();
    if (!u) return;
    setStatus('loading');
    setError('');
    setProgress(null);
    try {
      const data = await fetchStatsFmData(u, setProgress, forceRefresh);
      setConnectedUser(data.user.customId);
      setCachedAt(new Date(data.fetchedAt));
      setStatus('connected');
      await onData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [username, onData]);

  const handleDisconnect = useCallback(() => {
    clearCache();
    setStatus('idle');
    setConnectedUser('');
    setCachedAt(null);
    setProgress(null);
  }, []);

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={sfDot} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>stats.fm</span>
            {status === 'connected' && (
              <span style={{ fontSize: 10, color: '#34d399', background: 'rgba(52,211,153,0.12)', padding: '2px 7px', borderRadius: 10, letterSpacing: 0.5 }}>
                Connected
              </span>
            )}
          </div>
          <p style={{ fontSize: 10, color: '#334155', margin: '3px 0 0', letterSpacing: 0.2 }}>
            Real play counts · No developer setup needed
          </p>
        </div>
        {onClose && (
          <button className="cosmos-modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={11} />
          </button>
        )}
      </div>

      {/* Connected state */}
      {status === 'connected' && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#e2e8f0' }}>{connectedUser}</div>
              {cachedAt && (
                <div style={{ fontSize: 10, color: '#334155' }}>
                  Cached · {cachedAt.toLocaleDateString()} {cachedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              className="ui-pill-btn"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => void handleConnect(true)}
              aria-label="Refresh data from stats.fm"
            >
              Refresh data
            </button>
            <button
              style={{ ...disconnectBtnStyle }}
              onClick={handleDisconnect}
              aria-label="Disconnect stats.fm account"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Input + connect */}
      {(status === 'idle' || status === 'error') && (
        <div style={{ marginBottom: cachedAt ? 0 : 14 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ position: 'absolute', left: 11, color: '#334155', display: 'flex', pointerEvents: 'none' }}>
              <SearchIcon size={13} />
            </span>
            <input
              style={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleConnect()}
              placeholder="Your stats.fm username"
              aria-label="stats.fm username"
              spellCheck={false}
              autoCapitalize="none"
            />
          </div>
          <button
            className="ui-pill-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '8px 0' }}
            onClick={() => void handleConnect()}
            disabled={!username.trim()}
            aria-label="Connect to stats.fm"
          >
            Connect
          </button>
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && progress && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, marginBottom: 10 }}>
            <div style={{
              height: '100%',
              width: `${Math.round((progress.done / progress.total) * 100)}%`,
              background: '#34d399',
              borderRadius: 1,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#475569' }}>{progress.step}…</div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div style={{ padding: '8px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 7, marginBottom: 10, fontSize: 11, color: '#fca5a5', lineHeight: 1.6 }}>
          {error}
        </div>
      )}

      {/* Requirements */}
      {status !== 'connected' && (
        <div style={requirementsStyle}>
          <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Requirements</div>
          {REQUIREMENTS.map((r) => (
            <div key={r} style={{ fontSize: 10, color: '#1e293b', marginBottom: 3, display: 'flex', gap: 6 }}>
              <span style={{ color: '#334155', flexShrink: 0 }}>·</span>
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const REQUIREMENTS = [
  'Free stats.fm account at stats.fm/login',
  'Connect your Spotify account in stats.fm settings',
  'Set profile to Public (Settings → Profile → Visibility)',
  'stats.fm needs at least a few days of history to be useful',
];

const sfDot: React.CSSProperties = {
  width: 10, height: 10, borderRadius: '50%',
  background: 'linear-gradient(135deg, #FF6B35, #ff8c5a)',
  flexShrink: 0,
};

const cardStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8,
  padding: '8px 12px 8px 32px',
  color: '#e2e8f0',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
  letterSpacing: 0.2,
};

const disconnectBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  background: 'none',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
  color: '#334155',
  fontSize: 11,
  cursor: 'pointer',
  letterSpacing: 0.2,
};

const requirementsStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: 8,
};
