import { useMemo, useEffect } from 'react';
import { CosmosCanvas } from '@music-cosmos/renderer-3d';
import { EntityPanel, SearchBar, VisualLegend, HoverTooltip } from '@music-cosmos/ui';
import type { EntityDisplay } from '@music-cosmos/ui';
import { useUIStore } from '../stores/ui-store.js';
import { useCosmosStore } from '../stores/cosmos-store.js';
import type { VisualScene, VisualNode } from '@music-cosmos/layout-engine';
import { EntityTypeToggles } from '../components/EntityTypeToggles.js';
import { EntityChildList } from '../components/EntityChildList.js';
import { ImportPanel } from '../components/ImportPanel.js';

interface MusicCosmosSceneProps {
  scene: VisualScene;
}

const TRACKING_TYPES = new Set(['planet', 'satellite']);
const CHILD_LIST_TYPES = new Set(['galaxy', 'star', 'planet']);

function toEntityDisplay(node: VisualNode): EntityDisplay {
  return {
    id: node.id,
    label: node.label,
    entityType: node.entityType,
    visualProps: {
      size: node.visualProps.size,
      brightness: node.visualProps.brightness,
      color: node.visualProps.color,
      mass: node.visualProps.mass,
      orbitRadius: node.visualProps.orbitRadius,
      orbitSpeed: node.visualProps.orbitSpeed,
    },
    metadata: node.metadata,
  };
}

export function MusicCosmosScene({ scene }: MusicCosmosSceneProps) {
  const selectedEntityId      = useUIStore((s) => s.selectedEntityId);
  const hoveredEntityId       = useUIStore((s) => s.hoveredEntityId);
  const searchQuery           = useUIStore((s) => s.searchQuery);
  const isTrackingEntity      = useUIStore((s) => s.isTrackingEntity);
  const isPaused              = useUIStore((s) => s.isPaused);
  const activeEntityTypes     = useUIStore((s) => s.activeEntityTypes);
  const galaxyParticleOpacity = useUIStore((s) => s.galaxyParticleOpacity);
  const isImportPanelOpen     = useUIStore((s) => s.isImportPanelOpen);
  const resetCameraKey        = useUIStore((s) => s.resetCameraKey);
  const selectEntity          = useUIStore((s) => s.selectEntity);
  const setHoveredEntity      = useUIStore((s) => s.setHoveredEntity);
  const setSearchQuery        = useUIStore((s) => s.setSearchQuery);
  const setTracking           = useUIStore((s) => s.setTracking);
  const togglePause           = useUIStore((s) => s.togglePause);
  const toggleEntityType      = useUIStore((s) => s.toggleEntityType);
  const setGalaxyParticleOpacity = useUIStore((s) => s.setGalaxyParticleOpacity);
  const toggleImportPanel     = useUIStore((s) => s.toggleImportPanel);
  const resetCamera           = useUIStore((s) => s.resetCamera);

  const dataset = useCosmosStore((s) => s.dataset);
  const rawData = useCosmosStore((s) => s.rawData);

  // Real stats from the normalized dataset — no longer empty!
  const statsMap = useMemo(() => dataset?.stats ?? new Map(), [dataset]);

  const nodeById = useMemo(() => new Map(scene.nodes.map((n) => [n.id, n])), [scene]);

  const selectedNode = selectedEntityId ? (nodeById.get(selectedEntityId) ?? null) : null;
  const hoveredNode  = hoveredEntityId  ? (nodeById.get(hoveredEntityId)  ?? null) : null;

  useEffect(() => {
    if (!selectedNode) { setTracking(false); return; }
    setTracking(TRACKING_TYPES.has(selectedNode.entityType));
  }, [selectedNode, setTracking]);

  const selectedDisplay = selectedNode ? toEntityDisplay(selectedNode) : null;
  // domainId links VisualNode back to the MusicDataset entity (e.g. 'a:burial')
  const selectedStats = selectedNode ? statsMap.get(selectedNode.domainId) : undefined;

  const cameraTarget = useMemo<readonly [number, number, number] | undefined>(() => {
    if (!selectedNode || TRACKING_TYPES.has(selectedNode.entityType)) return undefined;
    const ct = scene.cameraTargets.get(selectedNode.id);
    return ct ? [ct.position.x, ct.position.y, ct.position.z] as const : undefined;
  }, [selectedNode, scene]);

  const cameraLookAt = useMemo<readonly [number, number, number] | undefined>(() => {
    if (!selectedNode || TRACKING_TYPES.has(selectedNode.entityType)) return undefined;
    const ct = scene.cameraTargets.get(selectedNode.id);
    return ct ? [ct.lookAt.x, ct.lookAt.y, ct.lookAt.z] as const : undefined;
  }, [selectedNode, scene]);

  // Child nodes for entity child list (albums for artist, tracks for album)
  const childNodes = useMemo(() => {
    if (!selectedNode || !CHILD_LIST_TYPES.has(selectedNode.entityType)) return [];
    return scene.nodes.filter((n) => n.parentId === selectedNode.id);
  }, [selectedNode, scene]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return scene.nodes
      .filter((n) => n.label.toLowerCase().includes(q))
      .map((n) => ({ id: n.id, label: n.label, entityType: n.entityType }))
      .slice(0, 20);
  }, [searchQuery, scene]);

  const trackingDistance = selectedNode?.entityType === 'satellite' ? 4 : 12;

  return (
    <>
      <CosmosCanvas
        scene={scene}
        selectedId={selectedEntityId}
        hoveredId={hoveredEntityId}
        cameraTarget={cameraTarget}
        cameraLookAt={cameraLookAt}
        isTrackingEntity={isTrackingEntity}
        trackingDistance={trackingDistance}
        isPaused={isPaused}
        activeEntityTypes={activeEntityTypes}
        galaxyParticleOpacity={galaxyParticleOpacity}
        resetCameraKey={resetCameraKey}
        onSelect={selectEntity}
        onHover={setHoveredEntity}
        onBackground={() => selectEntity(null)}
        onCameraFree={() => setTracking(false)}
      />

      <SearchBar results={searchResults} onSearch={setSearchQuery} onSelect={selectEntity} />

      <EntityPanel entity={selectedDisplay} stats={selectedStats} onClose={() => selectEntity(null)} />

      {selectedNode && childNodes.length > 0 && (
        <EntityChildList
          parentNode={selectedNode}
          childNodes={childNodes}
          stats={statsMap}
          onSelect={selectEntity}
        />
      )}

      <EntityTypeToggles
        activeTypes={activeEntityTypes}
        onToggle={toggleEntityType}
        galaxyParticleOpacity={galaxyParticleOpacity}
        onParticleOpacityChange={setGalaxyParticleOpacity}
      />

      <VisualLegend />

      <HoverTooltip label={hoveredNode?.label ?? null} entityType={hoveredNode?.entityType} />

      {/* Bottom-right: reset + pause */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 100,
      }}>
        <button
          onClick={resetCamera}
          title="Reset to universe view"
          style={{ ...circleBtn, background: 'rgba(5,5,20,0.82)', border: '1px solid #1e1e3f', color: '#555', fontSize: 16 }}
        >
          🏠
        </button>
        <button
          onClick={togglePause}
          title={isPaused ? 'Resume motion' : 'Pause motion'}
          style={{
            ...circleBtn,
            background: isPaused ? 'rgba(52,211,153,0.25)' : 'rgba(5,5,20,0.82)',
            border: isPaused ? '1px solid rgba(52,211,153,0.7)' : '1px solid #1e1e3f',
            color: isPaused ? '#6ee7b7' : '#555',
            fontSize: 18,
            boxShadow: isPaused ? '0 2px 12px rgba(52,211,153,0.2)' : 'none',
          }}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
      </div>

      {isTrackingEntity && (
        <button
          onClick={() => setTracking(false)}
          style={{
            position: 'absolute', bottom: 90, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(107,72,255,0.25)', border: '1px solid rgba(107,72,255,0.7)',
            borderRadius: 20, padding: '7px 18px',
            color: '#c4b5fd', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            backdropFilter: 'blur(10px)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 0.5, zIndex: 100,
            boxShadow: '0 2px 12px rgba(107,72,255,0.25)',
          }}
        >
          🔓 Unfix camera
        </button>
      )}

      {/* Top-left: stats + import */}
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          background: 'rgba(5,5,20,0.7)', border: '1px solid #1e1e3f',
          borderRadius: 8, padding: '5px 10px',
          fontSize: 11, color: '#555', fontFamily: 'monospace', backdropFilter: 'blur(8px)',
        }}>
          {scene.metadata.renderedNodes}/{scene.metadata.totalNodes} · seed {scene.metadata.seed}
        </div>
        <button
          onClick={toggleImportPanel}
          title="Import your music data"
          style={{
            background: 'rgba(107,72,255,0.18)', border: '1px solid rgba(107,72,255,0.5)',
            borderRadius: 8, padding: '5px 12px', color: '#a78bfa', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            backdropFilter: 'blur(8px)',
            fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: 0.3, zIndex: 100,
          }}
        >
          📂 {rawData?.source === 'mock' || !rawData ? 'Load your music' : 'Change data'}
        </button>
      </div>

      {isImportPanelOpen && <ImportPanel onClose={toggleImportPanel} />}
    </>
  );
}

const circleBtn: React.CSSProperties = {
  width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(10px)', transition: 'all 0.2s ease',
};
