import { useEffect } from 'react';
import { useCosmosStore } from '../stores/cosmos-store.js';
import { MusicCosmosScene } from '../scenes/MusicCosmosScene.js';
import { GalaxyIcon } from '@music-cosmos/ui';
import '../styles/ui.css';

export function App() {
  const scene     = useCosmosStore((s) => s.scene);
  const isLoading = useCosmosStore((s) => s.isLoading);
  const error     = useCosmosStore((s) => s.error);
  const loadMock  = useCosmosStore((s) => s.loadMockData);

  useEffect(() => { void loadMock(); }, [loadMock]);

  if (error) {
    return (
      <div className="cosmos-ui" style={centerStyle}>
        <p style={{ color: '#ef4444', fontSize: 13, fontFamily: 'system-ui', letterSpacing: 0.3 }}>
          {error}
        </p>
      </div>
    );
  }

  if (isLoading || !scene) {
    return (
      <div className="cosmos-ui" style={centerStyle}>
        <Loader />
      </div>
    );
  }

  return (
    <div
      className="cosmos-ui"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      <MusicCosmosScene scene={scene} />
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, fontFamily: 'system-ui', color: '#fff' }}>
      <div style={{ animation: 'cosmos-spin 4s linear infinite', color: '#818cf8', opacity: 0.8 }}>
        <GalaxyIcon size={36} />
      </div>
      <p style={{ fontSize: 11, color: '#334155', letterSpacing: 5, textTransform: 'uppercase', margin: 0 }}>
        Building cosmos
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
