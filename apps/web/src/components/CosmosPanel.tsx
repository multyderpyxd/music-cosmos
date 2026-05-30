import type { VisualNode } from '@music-cosmos/layout-engine';
import type { ListeningStats } from '@music-cosmos/domain';
import {
  CloseIcon, ChevronLeftIcon, ChevronRightIcon,
  GalaxyIcon, StarIcon, PlanetIcon, MoonIcon, AsteroidIcon,
  ArtistIcon, AlbumIcon, TrackIcon,
} from '@music-cosmos/ui';

interface CosmosPanelProps {
  selectedNode: VisualNode;
  nodeById: Map<string, VisualNode>;
  scene: { nodes: VisualNode[] };
  stats: Map<string, ListeningStats>;
  onSelect: (nodeId: string) => void;
  onClose: () => void;
}

const TYPE_META: Record<string, { label: string; Icon: React.FC<{ size?: number }> }> = {
  galaxy:    { label: 'Genre',   Icon: GalaxyIcon },
  star:      { label: 'Artist',  Icon: StarIcon },
  planet:    { label: 'Album',   Icon: PlanetIcon },
  satellite: { label: 'Track',   Icon: MoonIcon },
};

const CHILD_META: Record<string, { label: string; Icon: React.FC<{ size?: number }> } | null> = {
  galaxy:    { label: 'Artists', Icon: ArtistIcon },
  star:      { label: 'Albums',  Icon: AlbumIcon },
  planet:    { label: 'Tracks',  Icon: TrackIcon },
  satellite: null,
};

function EntityIcon({ type, size = 14 }: { type: string; size?: number }) {
  switch (type) {
    case 'galaxy':        return <GalaxyIcon size={size} />;
    case 'star':          return <StarIcon size={size} />;
    case 'planet':        return <PlanetIcon size={size} />;
    case 'satellite':     return <MoonIcon size={size} />;
    case 'asteroid-belt': return <AsteroidIcon size={size} />;
    default: return null;
  }
}

function formatNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

function formatMin(m: number): string {
  const h = Math.floor(m / 60);
  return h >= 1 ? `${h}h ${Math.round(m % 60)}m` : `${Math.round(m)}m`;
}

function buildAncestors(node: VisualNode, nodeById: Map<string, VisualNode>): VisualNode[] {
  const path: VisualNode[] = [];
  let cur = node;
  while (cur.parentId) {
    const p = nodeById.get(cur.parentId);
    if (!p) break;
    path.unshift(p);
    cur = p;
  }
  return path;
}

export function CosmosPanel({ selectedNode, nodeById, scene, stats, onSelect, onClose }: CosmosPanelProps) {
  const meta = TYPE_META[selectedNode.entityType] ?? { label: selectedNode.entityType, Icon: GalaxyIcon };
  const childMeta = CHILD_META[selectedNode.entityType] ?? null;
  const ancestors = buildAncestors(selectedNode, nodeById);
  const parent = ancestors[ancestors.length - 1] ?? null;

  const children = scene.nodes
    .filter((n) => n.parentId === selectedNode.id)
    .sort((a, b) => (stats.get(b.domainId)?.totalPlays ?? 0) - (stats.get(a.domainId)?.totalPlays ?? 0));

  const s = stats.get(selectedNode.domainId);
  const [r, g, b] = selectedNode.visualProps.color;
  const accent = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;

  return (
    <div style={panelStyle}>

      {/* Breadcrumb */}
      <div style={crumbBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          {ancestors.map((anc) => (
            <span key={anc.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                className="cosmos-breadcrumb-btn"
                onClick={() => onSelect(anc.id)}
                title={`Go to ${anc.label}`}
              >
                {anc.label}
              </button>
              <span style={{ color: '#1e293b', display: 'flex' }}><ChevronRightIcon size={10} /></span>
            </span>
          ))}
          <span style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedNode.label}
          </span>
        </div>
        <button className="cosmos-modal-close" onClick={onClose} aria-label="Close panel">
          <CloseIcon size={11} />
        </button>
      </div>

      {/* Entity header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, boxShadow: `0 0 10px ${accent}66`, flexShrink: 0, marginTop: 4 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 }}>
              {meta.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              {selectedNode.label}
            </div>
          </div>
        </div>

        {s ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 8px' }}>
              <StatCell label="Plays"   value={formatNum(s.totalPlays)} accent={accent} />
              <StatCell label="Time"    value={formatMin(s.totalMinutes)} />
              <StatCell label="30 days" value={formatNum(s.playsLast30Days)} accent={s.playsLast30Days > 0 ? '#34d399' : undefined} />
              <StatCell label="90 days" value={formatNum(s.playsLast90Days)} />
            </div>
            {s.lastPlayedAt && (
              <div style={{ fontSize: 10, color: '#1e293b', marginTop: 8, letterSpacing: 0.2 }}>
                Last heard · {s.lastPlayedAt.toLocaleDateString()}
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 11, color: '#1e293b', marginTop: 10 }}>No listening data</p>
        )}

        {/* Visual property bars */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <VisualBar label="Size"       value={selectedNode.visualProps.size}       max={4} color={accent} />
          <VisualBar label="Brightness" value={selectedNode.visualProps.brightness} max={1} color="#818cf8" />
          <VisualBar label="Mass"       value={selectedNode.visualProps.mass}       max={1} color="#475569" />
        </div>
      </div>

      {/* Back to parent */}
      {parent && (
        <button className="cosmos-back-btn" onClick={() => onSelect(parent.id)} aria-label={`Go to ${parent.label}`}>
          <ChevronLeftIcon size={12} />
          <span style={{ color: '#1e293b', display: 'flex', flexShrink: 0 }}>
            <EntityIcon type={parent.entityType} size={12} />
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {parent.label}
          </span>
        </button>
      )}

      {/* Children list */}
      {children.length > 0 && childMeta && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px 6px', fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 2, borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
            <childMeta.Icon size={11} />
            <span>{childMeta.label}</span>
            <span style={{ color: '#1e293b', marginLeft: 4 }}>{children.length}</span>
          </div>

          <div className="cosmos-panel-scroll" style={{ overflowY: 'auto', flex: 1 }}>
            {children.map((child) => {
              const cs = stats.get(child.domainId);
              const [cr, cg, cb] = child.visualProps.color;
              const ca = `rgb(${Math.round(cr * 255)},${Math.round(cg * 255)},${Math.round(cb * 255)})`;
              const hasRing = child.entityType === 'planet';
              return (
                <button key={child.id} className="cosmos-panel-item" onClick={() => onSelect(child.id)} aria-label={child.label}>
                  <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                    {hasRing && <div style={{ position: 'absolute', width: 18, height: 4, border: `1px solid ${ca}`, borderRadius: '50%', opacity: 0.35, transform: 'rotate(-20deg)' }} />}
                    <div style={{ width: child.entityType === 'satellite' ? 5 : 9, height: child.entityType === 'satellite' ? 5 : 9, borderRadius: '50%', background: ca, boxShadow: `0 0 5px ${ca}44`, position: 'relative' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="item-name" style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.1s' }}>
                      {child.label}
                    </div>
                    {cs && <div style={{ fontSize: 10, color: '#1e293b', marginTop: 1 }}>{formatNum(cs.totalPlays)} plays · {formatMin(cs.totalMinutes)}</div>}
                  </div>
                  {cs && cs.playsLast30Days > 0 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', flexShrink: 0, opacity: 0.8 }} title="Active in last 30 days" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1.5 }}>{label}</span>
      <span style={{ fontSize: 13, color: accent ?? '#475569', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function VisualBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, color: '#1e293b', marginBottom: 5, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
        <div style={{ height: '100%', width: `${Math.round(Math.min(1, value / max) * 100)}%`, background: color, borderRadius: 1, opacity: 0.75 }} />
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute', top: 16, right: 16, width: 300,
  maxHeight: 'calc(100vh - 40px)',
  background: 'rgba(3, 3, 12, 0.96)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 14, overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 16px 56px rgba(0,0,0,0.75)',
  zIndex: 100,
  fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff',
};

const crumbBarStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 14px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  background: 'rgba(0,0,0,0.2)', flexShrink: 0,
};

const headerStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  flexShrink: 0,
};
