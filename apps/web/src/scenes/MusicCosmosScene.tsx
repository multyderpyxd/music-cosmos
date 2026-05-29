import { useMemo, useCallback } from 'react';
import { CosmosCanvas } from '@music-cosmos/renderer-3d';
import { EntityPanel, ViewModeSelector, SearchBar, VisualLegend, HoverTooltip } from '@music-cosmos/ui';
import type { EntityDisplay } from '@music-cosmos/ui';
import { useUIStore } from '../stores/ui-store.js';
import { useCosmosStore } from '../stores/cosmos-store.js';
import type { VisualScene, VisualNode } from '@music-cosmos/layout-engine';
import type { ListeningStats } from '@music-cosmos/domain';

interface MusicCosmosSceneProps {
  scene: VisualScene;
}

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
  const selectedEntityId = useUIStore((s) => s.selectedEntityId);
  const hoveredEntityId  = useUIStore((s) => s.hoveredEntityId);
  const viewMode         = useUIStore((s) => s.viewMode);
  const searchQuery      = useUIStore((s) => s.searchQuery);
  const selectEntity     = useUIStore((s) => s.selectEntity);
  const setHoveredEntity = useUIStore((s) => s.setHoveredEntity);
  const setViewMode      = useUIStore((s) => s.setViewMode);
  const setSearchQuery   = useUIStore((s) => s.setSearchQuery);
  const recomputeScene   = useCosmosStore((s) => s.recomputeScene);
  const rawData          = useCosmosStore((s) => s.rawData);

  // Build stats map from raw data via cosmos-store dataset
  const statsMap = useMemo<Map<string, ListeningStats>>(() => {
    // The dataset inside cosmos-store holds stats; we access it indirectly via rawData
    // For now, return empty — stats will be wired in Phase 3 via a dataset ref in cosmos-store
    return new Map();
  }, [rawData]);

  const nodeById = useMemo(() => new Map(scene.nodes.map((n) => [n.id, n])), [scene]);

  const selectedNode = selectedEntityId ? (nodeById.get(selectedEntityId) ?? null) : null;
  const hoveredNode  = hoveredEntityId  ? (nodeById.get(hoveredEntityId)  ?? null) : null;

  const selectedDisplay = selectedNode ? toEntityDisplay(selectedNode) : null;
  const selectedStats   = selectedNode ? statsMap.get(selectedNode.domainId) : undefined;

  const cameraTarget = useMemo<readonly [number, number, number] | undefined>(() => {
    if (!selectedNode) return undefined;
    const ct = scene.cameraTargets.get(selectedNode.id);
    if (!ct) return undefined;
    return [ct.position.x, ct.position.y, ct.position.z] as const;
  }, [selectedNode, scene]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return scene.nodes
      .filter((n) => n.label.toLowerCase().includes(q))
      .map((n) => ({ id: n.id, label: n.label, entityType: n.entityType }))
      .slice(0, 20);
  }, [searchQuery, scene]);

  const handleViewModeChange = useCallback((mode: typeof viewMode) => {
    setViewMode(mode);
    recomputeScene(mode);
  }, [setViewMode, recomputeScene]);

  return (
    <>
      <CosmosCanvas
        scene={scene}
        selectedId={selectedEntityId}
        hoveredId={hoveredEntityId}
        cameraTarget={cameraTarget}
        onSelect={selectEntity}
        onHover={setHoveredEntity}
        onBackground={() => selectEntity(null)}
      />

      <SearchBar
        results={searchResults}
        onSearch={setSearchQuery}
        onSelect={selectEntity}
      />

      <EntityPanel
        entity={selectedDisplay}
        stats={selectedStats}
        onClose={() => selectEntity(null)}
      />

      <ViewModeSelector current={viewMode} onChange={handleViewModeChange} />

      <VisualLegend />

      <HoverTooltip label={hoveredNode?.label ?? null} entityType={hoveredNode?.entityType} />

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
