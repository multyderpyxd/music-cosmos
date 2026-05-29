import { useMemo, useEffect } from 'react';
import { CosmosCanvas } from '@music-cosmos/renderer-3d';
import { EntityPanel, SearchBar, VisualLegend, HoverTooltip } from '@music-cosmos/ui';
import type { EntityDisplay } from '@music-cosmos/ui';
import { useUIStore } from '../stores/ui-store.js';
import { useCosmosStore } from '../stores/cosmos-store.js';
import type { VisualScene, VisualNode } from '@music-cosmos/layout-engine';
import type { ListeningStats } from '@music-cosmos/domain';
import { EntityTypeToggles } from '../components/EntityTypeToggles.js';

interface MusicCosmosSceneProps {
  scene: VisualScene;
}

const TRACKING_TYPES = new Set(['planet', 'satellite']);

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
  const selectedEntityId       = useUIStore((s) => s.selectedEntityId);
  const hoveredEntityId        = useUIStore((s) => s.hoveredEntityId);
  const searchQuery            = useUIStore((s) => s.searchQuery);
  const isTrackingEntity       = useUIStore((s) => s.isTrackingEntity);
  const isPaused               = useUIStore((s) => s.isPaused);
  const activeEntityTypes      = useUIStore((s) => s.activeEntityTypes);
  const galaxyParticleOpacity  = useUIStore((s) => s.galaxyParticleOpacity);
  const selectEntity           = useUIStore((s) => s.selectEntity);
  const setHoveredEntity       = useUIStore((s) => s.setHoveredEntity);
  const setSearchQuery         = useUIStore((s) => s.setSearchQuery);
  const setTracking            = useUIStore((s) => s.setTracking);
  const togglePause            = useUIStore((s) => s.togglePause);
  const toggleEntityType       = useUIStore((s) => s.toggleEntityType);
  const setGalaxyParticleOpacity = useUIStore((s) => s.setGalaxyParticleOpacity);
  const rawData                = useCosmosStore((s) => s.rawData);

  const statsMap = useMemo<Map<string, ListeningStats>>(() => new Map(), [rawData]);
  const nodeById = useMemo(() => new Map(scene.nodes.map((n) => [n.id, n])), [scene]);

  const selectedNode = selectedEntityId ? (nodeById.get(selectedEntityId) ?? null) : null;
  const hoveredNode  = hoveredEntityId  ? (nodeById.get(hoveredEntityId)  ?? null) : null;

  useEffect(() => {
    if (!selectedNode) { setTracking(false); return; }
    setTracking(TRACKING_TYPES.has(selectedNode.entityType));
  }, [selectedNode, setTracking]);

  const selectedDisplay = selectedNode ? toEntityDisplay(selectedNode) : null;
  const selectedStats   = selectedNode ? statsMap.get(selectedNode.domainId) : undefined;

  const cameraTarget = useMemo<readonly [number, number, number] | undefined>(() => {
    if (!selectedNode || TRACKING_TYPES.has(selectedNode.entityType)) return undefined;
    const ct = scene.cameraTargets.get(selectedNode.id);
    if (!ct) return undefined;
    return [ct.position.x, ct.position.y, ct.position.z] as const;
  }, [selectedNode, scene]);

  const cameraLookAt = useMemo<readonly [number, number, number] | undefined>(() => {
    if (!selectedNode || TRACKING_TYPES.has(selectedNode.entityType)) return undefined;
    const ct = scene.cameraTargets.get(selectedNode.id);
    if (!ct) return undefined;
    return [ct.lookAt.x, ct.lookAt.y, ct.lookAt.z] as const;
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
        onSelect={selectEntity}
        onHover={setHoveredEntity}
        onBackground={() => selectEntity(null)}
        onCameraFree={() => setTracking(false)}
      />

      <SearchBar results={searchResults} onSearch={setSearchQuery} onSelect={selectEntity} />

      <EntityPanel entity={selectedDisplay} stats={selectedStats} onClose={() => selectEntity(null)} />

      {/* Entity type visibility toggles + galaxy particle opacity */}
      <EntityTypeToggles
        activeTypes={activeEntityTypes}
        onToggle={toggleEntityType}
        galaxyParticleOpacity={galaxyParticleOpacity}
        onParticleOpacityChange={setGalaxyParticleOpacity}
      />

      <VisualLegend />

      <HoverTooltip label={hoveredNode?.label ?? null} entityType={hoveredNode?.entityType} />

      {/* Pause / resume orbital motion */}
      <button
        onClick={togglePause}
        title={isPaused ? 'Resume motion' : 'Pause motion'}
        style={{
          position: 'absolute', bottom: 24, right: 24,
          width: 42, height: 42, borderRadius: '50%',
          background: isPaused ? 'rgba(52,211,153,0.25)' : 'rgba(5,5,20,0.82)',
          border: isPaused ? '1px solid rgba(52,211,153,0.7)' : '1px solid #1e1e3f',
          color: isPaused ? '#6ee7b7' : '#555',
          fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)', zIndex: 100,
          boxShadow: isPaused ? '0 2px 12px rgba(52,211,153,0.2)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {isPaused ? '▶' : '⏸'}
      </button>

      {/* Unfix camera — only shown when tracking an orbiting body */}
      {isTrackingEntity && (
        <button
          onClick={() => setTracking(false)}
          style={{
            position: 'absolute', bottom: 90, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(107,72,255,0.25)',
            border: '1px solid rgba(107,72,255,0.7)',
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

      <div style={{
        position: 'absolute', top: 16, left: 16,
        background: 'rgba(5,5,20,0.7)', border: '1px solid #1e1e3f',
        borderRadius: 8, padding: '5px 10px',
        fontSize: 11, color: '#555', fontFamily: 'monospace',
        backdropFilter: 'blur(8px)',
      }}>
        {scene.metadata.renderedNodes} / {scene.metadata.totalNodes} nodes · seed {scene.metadata.seed}
      </div>
    </>
  );
}
