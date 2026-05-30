import { useState, useCallback } from 'react';
import { getLastFmApiKey, setLastFmApiKey, clearLastFmCache } from '../lib/lastFmApi.js';
import { SearchIcon } from '@music-cosmos/ui';

export function LastFmSettings() {
  const [key, setKey] = useState(getLastFmApiKey() ?? '');
  const [saved, setSaved] = useState(!!getLastFmApiKey());
  const [cleared, setCleared] = useState(false);

  const handleSave = useCallback(() => {
    if (!key.trim()) return;
    setLastFmApiKey(key.trim());
    setSaved(true);
  }, [key]);

  const handleClear = useCallback(() => {
    clearLastFmCache();
    setCleared(true);
    setTimeout(() => setCleared(false), 1500);
  }, []);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e4224e', flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>Last.fm</span>
        {saved && (
          <span style={{ fontSize: 9, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 7px', borderRadius: 10, letterSpacing: 0.5 }}>
            Active
          </span>
        )}
      </div>
      <p style={{ fontSize: 10, color: '#334155', margin: '0 0 10px', lineHeight: 1.5 }}>
        When enabled, artists without a known genre are automatically enriched
        using Last.fm top tags. Results are cached 30 days locally.
      </p>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ position: 'absolute', left: 10, color: '#334155', display: 'flex', pointerEvents: 'none' }}>
          <SearchIcon size={12} />
        </span>
        <input
          style={inputStyle}
          value={key}
          onChange={(e) => { setKey(e.target.value); setSaved(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Last.fm API key"
          spellCheck={false}
          autoCapitalize="none"
          type="password"
          aria-label="Last.fm API key"
        />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="ui-pill-btn"
          style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
          onClick={handleSave}
          disabled={!key.trim() || saved}
        >
          {saved ? 'Key saved' : 'Save key'}
        </button>
        <button
          style={clearBtnStyle}
          onClick={handleClear}
          title="Clear cached Last.fm tag results"
        >
          {cleared ? 'Cleared' : 'Clear cache'}
        </button>
      </div>

      <p style={{ fontSize: 9, color: '#1e293b', margin: '8px 0 0', lineHeight: 1.5 }}>
        Free API key at{' '}
        <span style={{ color: '#475569' }}>last.fm/api/account/create</span>
        {' '}· Key stored locally only
      </p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
  padding: '12px 14px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 7,
  padding: '7px 10px 7px 28px',
  color: '#e2e8f0',
  fontSize: 11,
  outline: 'none',
  boxSizing: 'border-box',
};

const clearBtnStyle: React.CSSProperties = {
  padding: '5px 10px',
  background: 'none',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 7,
  color: '#334155',
  fontSize: 10,
  cursor: 'pointer',
  flexShrink: 0,
};
