import { useEffect, useState } from 'react';
import { useCosmosStore } from '../stores/cosmos-store.js';
import { MusicCosmosScene } from '../scenes/MusicCosmosScene.js';
import { GalaxyIcon } from '@music-cosmos/ui';
import { getCachedData } from '../lib/statsFmApi.js';
import { handleSpotifyCallback, isSpotifyConnected, getAccessToken } from '../lib/spotifyAuth.js';
import '../styles/ui.css';

export function App() {
  const scene                  = useCosmosStore((s) => s.scene);
  const isLoading              = useCosmosStore((s) => s.isLoading);
  const error                  = useCosmosStore((s) => s.error);
  const loadMock               = useCosmosStore((s) => s.loadMockData);
  const loadFromStatsFm        = useCosmosStore((s) => s.loadFromStatsFm);
  const loadFromSpotifyProfile = useCosmosStore((s) => s.loadFromSpotifyProfile);

  const [bootStatus, setBootStatus] = useState('');

  useEffect(() => {
    async function boot() {
      // 1. Check for Spotify OAuth callback (?code= in URL)
      const params = new URLSearchParams(window.location.search);
      if (params.has('code')) {
        setBootStatus('Completing Spotify login…');
        const success = await handleSpotifyCallback();
        if (success) {
          // Token now stored — fetch Spotify profile data
          setBootStatus('Fetching your Spotify top artists…');
          const token = getAccessToken();
          if (token) {
            try {
              const { fetchSpotifyProfileSnapshot } = await import('../lib/spotifyApiClient.js');
              const { SpotifyProfileSnapshotAdapter } = await import('@music-cosmos/data-adapters');
              const snapshot = await fetchSpotifyProfileSnapshot(token);
              const raw = new SpotifyProfileSnapshotAdapter().convert(snapshot);
              await loadFromSpotifyProfile(snapshot);
              // Also persist for future sessions (no re-fetch needed)
              try {
                localStorage.setItem('cosmos_spotify_snapshot', JSON.stringify(snapshot));
              } catch { /* storage full */ }
              return;
            } catch {
              // fall through to other sources
            }
          }
        }
      }

      // 2. Already connected to Spotify? Load cached snapshot.
      if (isSpotifyConnected()) {
        const cached = localStorage.getItem('cosmos_spotify_snapshot');
        if (cached) {
          try {
            const snapshot = JSON.parse(cached);
            await loadFromSpotifyProfile(snapshot);
            return;
          } catch { /* corrupt cache */ }
        }
      }

      // 3. stats.fm cached data
      const sfCached = getCachedData();
      if (sfCached) {
        await loadFromStatsFm(sfCached);
        return;
      }

      // 4. Fallback: mock data
      await loadMock();
    }

    void boot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="cosmos-ui" style={centerStyle}>
        <p style={{ color: '#ef4444', fontSize: 13, fontFamily: 'system-ui', letterSpacing: 0.3 }}>{error}</p>
      </div>
    );
  }

  if (isLoading || !scene) {
    return (
      <div className="cosmos-ui" style={centerStyle}>
        <Loader message={bootStatus} />
      </div>
    );
  }

  return (
    <div className="cosmos-ui" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <MusicCosmosScene scene={scene} />
    </div>
  );
}

function Loader({ message }: { message?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, fontFamily: 'system-ui', color: '#fff' }}>
      <div style={{ animation: 'cosmos-spin 4s linear infinite', color: '#818cf8', opacity: 0.8 }}>
        <GalaxyIcon size={36} />
      </div>
      <p style={{ fontSize: 11, color: '#334155', letterSpacing: 5, textTransform: 'uppercase', margin: 0 }}>
        {message || 'Building cosmos'}
      </p>
      <style>{`@keyframes cosmos-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const centerStyle: React.CSSProperties = {
  width: '100%', height: '100%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#020210',
};
