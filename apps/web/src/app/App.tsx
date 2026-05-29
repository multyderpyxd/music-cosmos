import { useEffect, useState } from 'react';
import { MockDataAdapter } from '@music-cosmos/data-adapters';
import { normalize } from '@music-cosmos/normalization';
import { mapDatasetToCosmicGraph } from '@music-cosmos/cosmos-engine';
import { computeLayout } from '@music-cosmos/layout-engine';
import { defaultVisualRules, defaultRenderBudget, defaultLayoutConfig } from '@music-cosmos/config';
import type { VisualScene } from '@music-cosmos/layout-engine';

const adapter = new MockDataAdapter();

export function App() {
  const [scene, setScene] = useState<VisualScene | null>(null);
  const [status, setStatus] = useState('Loading cosmos...');

  useEffect(() => {
    async function buildScene() {
      try {
        setStatus('Loading data...');
        const raw = await adapter.load();

        setStatus('Normalizing...');
        const dataset = normalize(raw);

        setStatus('Building cosmic graph...');
        const graph = mapDatasetToCosmicGraph(
          dataset,
          dataset.stats,
          defaultVisualRules,
          defaultRenderBudget,
          'universe',
        );

        setStatus('Computing layout...');
        const visualScene = computeLayout(graph, defaultLayoutConfig, defaultRenderBudget, 'universe');

        setScene(visualScene);
        setStatus('');
      } catch (err) {
        setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    void buildScene();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'monospace', background: '#050510' }}>
      {status ? (
        <div>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>{status}</p>
        </div>
      ) : scene ? (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 300, letterSpacing: 8, marginBottom: 8 }}>MUSIC COSMOS</h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Universe pipeline ready</p>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 2 }}>
            <div>Nodes: <span style={{ color: '#9B59B6' }}>{scene.metadata.totalNodes}</span></div>
            <div>Rendered: <span style={{ color: '#3498DB' }}>{scene.metadata.renderedNodes}</span></div>
            <div>Seed: <span style={{ color: '#1ABC9C' }}>{scene.metadata.seed}</span></div>
          </div>
          <p style={{ fontSize: 11, color: '#333', marginTop: 24 }}>
            Phase 0 complete — 3D rendering coming in Phase 2
          </p>
        </div>
      ) : null}
    </div>
  );
}
