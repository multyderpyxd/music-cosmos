import { useEffect } from 'react';
import { useCosmosStore } from '../stores/cosmos-store.js';
import { MusicCosmosScene } from '../scenes/MusicCosmosScene.js';

export function App() {
  const scene     = useCosmosStore((s) => s.scene);
  const isLoading = useCosmosStore((s) => s.isLoading);
  const error     = useCosmosStore((s) => s.error);
  const loadMock  = useCosmosStore((s) => s.loadMockData);

  useEffect(() => { void loadMock(); }, [loadMock]);

  if (error) {
    return (
      <div style={centerStyle}>
        <p style={{ color: '#e74c3c', fontSize: 14 }}>⚠ {error}</p>
      </div>
    );
  }

  if (isLoading || !scene) {
    return (
      <div style={centerStyle}>
        <Loader />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <MusicCosmosScene scene={scene} />
    </div>
  );
}

function Loader() {
  return (
    <div style={{ textAlign: 'center', fontFamily: 'monospace', color: '#fff' }}>
      <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 3s linear infinite' }}>🌌</div>
      <p style={{ fontSize: 14, color: '#666', letterSpacing: 4 }}>BUILDING COSMOS</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const centerStyle: React.CSSProperties = {
  width: '100%', height: '100%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#020210',
};
