import { useMemo, useEffect } from 'react';
import { CosmosCanvas } from '@music-cosmos/renderer-3d';
import { SearchBar, VisualLegend, HoverTooltip, HomeIcon, PauseIcon, PlayIcon, UnlockIcon, UploadIcon } from '@music-cosmos/ui';
import { useUIStore } from '../stores/ui-store.js';
import { useCosmosStore } from '../stores/cosmos-store.js';
import type { VisualScene, VisualNode } from '@music-cosmos/layout-engine';
import { EntityTypeToggles } from '../components/EntityTypeToggles.js';
import { ImportPanel } from '../components/ImportPanel.js';
import { CosmosPanel } from '../components/CosmosPanel.js';

interface MusicCosmosSceneProps {
  scene: VisualScene;
}

const TRACKING_TYPES = new Set(['planet', 'satellite']);

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

  const dataset     = useCosmosStore((s) => s.dataset);
  const rawData     = useCosmosStore((s) => s.rawData);
  const albumImages = useCosmosStore((s) => s.albumImages);

  // Real stats from the normalized dataset — no longer empty!
  const statsMap = useMemo(() => dataset?.stats ?? new Map(), [dataset]);

  const nodeById = useMemo(() => new Map(scene.nodes.map((n) => [n.id, n])), [scene]);

  const selectedNode = selectedEntityId ? (nodeById.get(selectedEntityId) ?? null) : null;
  const hoveredNode  = hoveredEntityId  ? (nodeById.get(hoveredEntityId)  ?? null) : null;

  useEffect(() => {
    if (!selectedNode) { setTracking(false); return; }
    setTracking(TRACKING_TYPES.has(selectedNode.entityType));
  }, [selectedNode, setTracking]);

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
        albumImages={albumImages}
        resetCameraKey={resetCameraKey}
        onSelect={selectEntity}
        onHover={setHoveredEntity}
        onBackground={() => selectEntity(null)}
        onCameraFree={() => setTracking(false)}
      />

      <SearchBar results={searchResults} onSearch={setSearchQuery} onSelect={selectEntity} />

      {/* Unified navigation panel — replaces EntityPanel + EntityChildList */}
      {selectedNode && (
        <CosmosPanel
          selectedNode={selectedNode}
          nodeById={nodeById}
          scene={scene}
          stats={statsMap}
          onSelect={selectEntity}
          onClose={() => selectEntity(null)}
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
      <div style={{ position: 'absolute', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 100 }}>
        <button
          className="ui-ctrl-btn"
          onClick={resetCamera}
          title="Reset to universe view"
          aria-label="Reset camera to universe view"
        >
          <HomeIcon size={16} />
        </button>
        <button
          className={`ui-ctrl-btn${isPaused ? ' is-active' : ''}`}
          onClick={togglePause}
          title={isPaused ? 'Resume orbital motion' : 'Pause orbital motion'}
          aria-label={isPaused ? 'Resume' : 'Pause'}
          aria-pressed={isPaused}
        >
          {isPaused ? <PlayIcon size={15} /> : <PauseIcon size={15} />}
        </button>
      </div>

      {/* Unfix camera — visible when tracking an orbiting body */}
      {isTrackingEntity && (
        <button
          className="ui-unfix-btn"
          onClick={() => setTracking(false)}
          style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
          aria-label="Release camera from tracked body"
        >
          <UnlockIcon size={13} />
          <span style={{ fontFamily: 'system-ui', fontSize: 11, letterSpacing: 0.3 }}>Unfix camera</span>
        </button>
      )}

      {/* Top-left: node stats + import */}
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, zIndex: 100 }}>
        <div style={{
          background: 'rgba(5,5,20,0.82)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 7, padding: '5px 10px',
          fontSize: 10, color: '#334155', fontFamily: 'monospace', backdropFilter: 'blur(12px)',
          letterSpacing: 0.3,
        }}>
          {scene.metadata.renderedNodes}/{scene.metadata.totalNodes} · {scene.metadata.seed}
        </div>
        <button
          className="ui-pill-btn"
          onClick={toggleImportPanel}
          aria-label={rawData?.source === 'mock' || !rawData ? 'Load your music data' : 'Change music data source'}
          title="Import music data from stats.fm or Spotify"
        >
          <UploadIcon size={12} />
          <span>{rawData?.source === 'mock' || !rawData ? 'Load your music' : 'Change data'}</span>
        </button>
      </div>

      {isImportPanelOpen && <ImportPanel onClose={toggleImportPanel} />}
    </>
  );
}

