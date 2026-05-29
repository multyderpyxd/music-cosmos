import type { VisualNode } from '@music-cosmos/layout-engine';
import type { ListeningStats } from '@music-cosmos/domain';

interface EntityChildListProps {
  parentNode: VisualNode;
  childNodes: VisualNode[];
  stats: Map<string, ListeningStats>;
  onSelect: (nodeId: string) => void;
}

const TYPE_LABELS: Record<string, { plural: string; icon: string }> = {
  planet:    { plural: 'Albums',  icon: '🪐' },
  satellite: { plural: 'Tracks',  icon: '🌙' },
  star:      { plural: 'Artists', icon: '⭐' },
};

function formatPlays(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  if (h >= 1) return `${h}h ${Math.round(m % 60)}m`;
  return `${Math.round(m)}m`;
}

export function EntityChildList({ parentNode, childNodes, stats, onSelect }: EntityChildListProps) {
  if (childNodes.length === 0) return null;

  const firstChildType = childNodes[0]?.entityType ?? 'planet';
  const label = TYPE_LABELS[firstChildType] ?? { plural: 'Entities', icon: '◦' };

  // Sort by plays descending
  const sorted = [...childNodes].sort((a, b) => {
    const pa = stats.get(a.domainId)?.totalPlays ?? 0;
    const pb = stats.get(b.domainId)?.totalPlays ?? 0;
    return pb - pa;
  });

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: 13 }}>{label.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#aaa' }}>
          {label.plural} · {sorted.length}
        </span>
      </div>

      <div style={listStyle}>
        {sorted.map((node) => {
          const s = stats.get(node.domainId);
          const [r, g, b] = node.visualProps.color;
          const color = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;

          return (
            <button
              key={node.id}
              style={itemStyle}
              onClick={() => onSelect(node.id)}
              title={`${node.label}${s ? ` · ${formatPlays(s.totalPlays)} plays` : ''}`}
            >
              {/* Miniature celestial body */}
              <CelestialDot
                type={node.entityType}
                color={color}
                size={node.visualProps.size}
                brightness={node.visualProps.brightness}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, color: '#ccc',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {node.label}
                </div>
                {s && (
                  <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                    {formatPlays(s.totalPlays)} plays · {formatMinutes(s.totalMinutes)}
                  </div>
                )}
              </div>

              {/* Recency dot */}
              {s && s.playsLast30Days > 0 && (
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#34D399', flexShrink: 0,
                  boxShadow: '0 0 4px #34D399',
                }} title="Played in last 30 days" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CelestialDot({
  type, color, size, brightness,
}: { type: string; color: string; size: number; brightness: number }) {
  const dim = type === 'satellite' ? 10 : type === 'planet' ? 14 : 16;
  const opacity = Math.max(0.5, brightness);
  const hasRing = type === 'planet';

  return (
    <div style={{
      width: 20, height: 20, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Ring for planets */}
        {hasRing && (
          <div style={{
            position: 'absolute',
            width: dim + 8, height: 4,
            borderRadius: '50%',
            border: `1px solid ${color}`,
            opacity: opacity * 0.6,
            transform: 'rotate(-20deg)',
          }} />
        )}
        {/* Core body */}
        <div style={{
          width: dim, height: dim,
          borderRadius: '50%',
          background: color,
          opacity,
          boxShadow: `0 0 ${Math.round(size * 2)}px ${color}44`,
          flexShrink: 0,
        }} />
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 312, // Left of EntityPanel (280 + 16 + 16)
  width: 240,
  maxHeight: 'calc(100vh - 120px)',
  background: 'rgba(5, 5, 20, 0.92)',
  border: '1px solid #1e1e3f',
  borderRadius: 12,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  zIndex: 99,
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 14px',
  borderBottom: '1px solid #1a1a2e',
  flexShrink: 0,
};

const listStyle: React.CSSProperties = {
  overflowY: 'auto',
  flex: 1,
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid #0d0d1e',
  padding: '9px 14px',
  cursor: 'pointer',
  color: '#fff',
  textAlign: 'left',
  transition: 'background 0.1s ease',
};
