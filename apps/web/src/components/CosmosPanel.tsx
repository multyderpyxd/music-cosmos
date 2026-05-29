import type { VisualNode } from '@music-cosmos/layout-engine';
import type { ListeningStats } from '@music-cosmos/domain';

interface CosmosPanelProps {
  selectedNode: VisualNode;
  nodeById: Map<string, VisualNode>;
  scene: { nodes: VisualNode[] };
  stats: Map<string, ListeningStats>;
  onSelect: (nodeId: string) => void;
  onClose: () => void;
}

const TYPE_META: Record<string, { icon: string; label: string; childIcon: string; childLabel: string }> = {
  galaxy:    { icon: '🌌', label: 'Genre',   childIcon: '⭐', childLabel: 'Artists' },
  star:      { icon: '⭐', label: 'Artist',  childIcon: '🪐', childLabel: 'Albums' },
  planet:    { icon: '🪐', label: 'Album',   childIcon: '🌙', childLabel: 'Tracks' },
  satellite: { icon: '🌙', label: 'Track',   childIcon: '',   childLabel: '' },
};

function formatNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

function formatMin(m: number): string {
  const h = Math.floor(m / 60);
  return h >= 1 ? `${h}h ${Math.round(m % 60)}m` : `${Math.round(m)}m`;
}

function buildAncestors(node: VisualNode, nodeById: Map<string, VisualNode>): VisualNode[] {
  const path: VisualNode[] = [];
  let current = node;
  while (current.parentId) {
    const parent = nodeById.get(current.parentId);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  return path;
}

export function CosmosPanel({ selectedNode, nodeById, scene, stats, onSelect, onClose }: CosmosPanelProps) {
  const meta = TYPE_META[selectedNode.entityType] ?? { icon: '◦', label: selectedNode.entityType, childIcon: '', childLabel: '' };
  const ancestors = buildAncestors(selectedNode, nodeById);
  const parent = ancestors[ancestors.length - 1] ?? null;
  const children = scene.nodes.filter((n) => n.parentId === selectedNode.id);
  const s = stats.get(selectedNode.domainId);

  const [r, g, b] = selectedNode.visualProps.color;
  const accentColor = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;

  // Sort children by plays
  const sortedChildren = [...children].sort((a, b) => {
    const pa = stats.get(a.domainId)?.totalPlays ?? 0;
    const pb = stats.get(b.domainId)?.totalPlays ?? 0;
    return pb - pa;
  });

  return (
    <div style={panelStyle}>
      {/* ── Header: breadcrumb path ── */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          {ancestors.map((anc, i) => {
            const am = TYPE_META[anc.entityType];
            return (
              <span key={anc.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  style={breadcrumbBtn}
                  onClick={() => onSelect(anc.id)}
                  title={`Go to ${anc.label}`}
                >
                  {am?.icon} {anc.label}
                </button>
                {i < ancestors.length && (
                  <span style={{ color: '#333', fontSize: 10 }}>›</span>
                )}
              </span>
            );
          })}
          <span style={{ fontSize: 11, color: '#777', fontWeight: 500 }}>
            {meta.icon} {selectedNode.label}
          </span>
        </div>
        <button style={closeBtn} onClick={onClose}>✕</button>
      </div>

      {/* ── Current entity ── */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: accentColor,
            boxShadow: `0 0 16px ${accentColor}55`,
            flexShrink: 0,
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 2 }}>
              {meta.label}
            </div>
            <div style={{
              fontSize: 17, fontWeight: 700, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {selectedNode.label}
            </div>
          </div>
        </div>

        {/* Stats */}
        {s ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <StatRow label="Total plays"    value={formatNum(s.totalPlays)} accent={accentColor} />
            <StatRow label="Minutes"        value={formatMin(s.totalMinutes)} />
            <StatRow label="Last 30 days"   value={`${formatNum(s.playsLast30Days)} plays`}
              accent={s.playsLast30Days > 0 ? '#34D399' : undefined} />
            <StatRow label="Last 90 days"   value={`${formatNum(s.playsLast90Days)} plays`} />
            {s.lastPlayedAt && (
              <StatRow label="Last heard" value={s.lastPlayedAt.toLocaleDateString()} />
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: '#444', margin: 0 }}>No stats available</p>
        )}

        {/* Visual properties bar */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid #111' }}>
          <VisualBar label="Size"       value={selectedNode.visualProps.size}       max={4}  color={accentColor} />
          <VisualBar label="Brightness" value={selectedNode.visualProps.brightness} max={1}  color="#FFD700" />
          <VisualBar label="Mass"       value={selectedNode.visualProps.mass}       max={1}  color="#9B59B6" />
        </div>
      </div>

      {/* ── Navigation: back to parent ── */}
      {parent && (
        <button style={parentBtnStyle} onClick={() => onSelect(parent.id)}>
          <span style={{ fontSize: 12 }}>←</span>
          <span style={{ fontSize: 11, color: '#777' }}>
            {(TYPE_META[parent.entityType]?.icon ?? '')} {parent.label}
          </span>
        </button>
      )}

      {/* ── Children list ── */}
      {sortedChildren.length > 0 && (
        <>
          <div style={{
            padding: '10px 20px 6px',
            fontSize: 11, color: '#555',
            textTransform: 'uppercase', letterSpacing: 1.5,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>{meta.childIcon}</span>
            <span>{meta.childLabel}</span>
            <span style={{ color: '#333', marginLeft: 4 }}>{sortedChildren.length}</span>
          </div>

          <div style={listStyle}>
            {sortedChildren.map((child) => {
              const cs = stats.get(child.domainId);
              const [cr, cg, cb] = child.visualProps.color;
              const childColor = `rgb(${Math.round(cr * 255)},${Math.round(cg * 255)},${Math.round(cb * 255)})`;
              const hasOrbit = child.entityType === 'planet';

              return (
                <button key={child.id} style={childItemStyle} onClick={() => onSelect(child.id)}>
                  {/* Mini cosmic body */}
                  <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                    {hasOrbit && (
                      <div style={{
                        position: 'absolute',
                        width: 20, height: 4,
                        border: `1px solid ${childColor}`,
                        borderRadius: '50%',
                        opacity: 0.5,
                        transform: 'rotate(-20deg)',
                      }} />
                    )}
                    <div style={{
                      width: child.entityType === 'satellite' ? 8 : 12,
                      height: child.entityType === 'satellite' ? 8 : 12,
                      borderRadius: '50%',
                      background: childColor,
                      boxShadow: `0 0 6px ${childColor}66`,
                    }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {child.label}
                    </div>
                    {cs && (
                      <div style={{ fontSize: 10, color: '#555' }}>
                        {formatNum(cs.totalPlays)} plays · {formatMin(cs.totalMinutes)}
                      </div>
                    )}
                  </div>

                  {cs && cs.playsLast30Days > 0 && (
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#34D399', flexShrink: 0,
                    }} title="Active in last 30 days" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #0d0d1e' }}>
      <span style={{ fontSize: 11, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 12, color: accent ?? '#aaa', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function VisualBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, color: '#444', marginBottom: 3, textAlign: 'center' }}>{label}</div>
      <div style={{ height: 3, background: '#111', borderRadius: 2 }}>
        <div style={{
          height: '100%',
          width: `${Math.round(Math.min(1, value / max) * 100)}%`,
          background: color,
          borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16, right: 16,
  width: 300,
  maxHeight: 'calc(100vh - 40px)',
  background: 'rgba(6, 6, 22, 0.95)',
  border: '1px solid #1e1e3f',
  borderRadius: 14,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
  zIndex: 100,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: '#fff',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '12px 16px',
  borderBottom: '1px solid #1a1a2e',
  background: 'rgba(0,0,0,0.3)',
  flexShrink: 0,
};

const breadcrumbBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#555',
  fontSize: 11,
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'inherit',
};

const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#444',
  cursor: 'pointer',
  fontSize: 13,
  padding: '0 0 0 4px',
  flexShrink: 0,
  lineHeight: 1,
};

const parentBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid #0d0d1e',
  padding: '9px 20px',
  cursor: 'pointer',
  textAlign: 'left',
  flexShrink: 0,
};

const listStyle: React.CSSProperties = {
  overflowY: 'auto',
  flex: 1,
};

const childItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid #0a0a18',
  padding: '8px 16px',
  cursor: 'pointer',
  color: '#fff',
  textAlign: 'left',
};
