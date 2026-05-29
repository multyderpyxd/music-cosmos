import type { ListeningStats } from '@music-cosmos/domain';

// Local display type — keeps ui decoupled from layout-engine
export interface EntityDisplay {
  id: string;
  label: string;
  entityType: string;
  visualProps: {
    size: number;
    brightness: number;
    color: readonly [number, number, number];
    mass: number;
    orbitRadius?: number;
    orbitSpeed?: number;
  };
  metadata: Record<string, unknown>;
}

interface EntityPanelProps {
  entity: EntityDisplay | null;
  stats?: ListeningStats;
  onClose: () => void;
}

const ENTITY_LABELS: Record<string, string> = {
  galaxy: '🌌 Genre',
  star: '⭐ Artist',
  planet: '🪐 Album',
  satellite: '🌙 Track',
  'asteroid-belt': '💫 Hidden Tracks',
};

export function EntityPanel({ entity, stats, onClose }: EntityPanelProps) {
  if (!entity) return null;

  const [r, g, b] = entity.visualProps.color;
  const color = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 2 }}>
            {ENTITY_LABELS[entity.entityType] ?? entity.entityType}
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entity.label}
          </span>
        </div>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />
        <button style={closeStyle} onClick={onClose}>✕</button>
      </div>

      {stats && (
        <div style={statsGrid}>
          <StatRow label="Total plays" value={stats.totalPlays.toLocaleString()} accent={color} />
          <StatRow label="Minutes listened" value={Math.round(stats.totalMinutes).toLocaleString()} accent={color} />
          <StatRow label="Plays last 30 days" value={stats.playsLast30Days.toLocaleString()} accent={color} />
          <StatRow label="Plays last 90 days" value={stats.playsLast90Days.toLocaleString()} accent={color} />
          <StatRow label="First listen" value={stats.firstPlayedAt.toLocaleDateString()} />
          <StatRow label="Last listen" value={stats.lastPlayedAt.toLocaleDateString()} />
        </div>
      )}

      {entity.entityType === 'asteroid-belt' && (
        <p style={{ fontSize: 12, color: '#888', marginTop: 12, lineHeight: 1.6 }}>
          {(entity.metadata['hiddenCount'] as number | undefined) ?? 0} tracks hidden at this zoom level.
          Switch to Album view to see them all.
        </p>
      )}

      <div style={visualBar}>
        <BarItem label="Size" value={entity.visualProps.size} color={color} />
        <BarItem label="Brightness" value={entity.visualProps.brightness} color="#FFD700" />
        <BarItem label="Mass" value={entity.visualProps.mass} color="#9B59B6" />
      </div>
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1a1a2e' }}>
      <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
      <span style={{ fontSize: 13, color: accent ?? '#ccc', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function BarItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1, padding: '0 6px' }}>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 3, textAlign: 'center' }}>{label}</div>
      <div style={{ height: 4, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round(Math.min(1, value) * 100)}%`, background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute', top: 16, right: 16, width: 280,
  background: 'rgba(5, 5, 20, 0.92)', border: '1px solid #1e1e3f',
  borderRadius: 12, padding: 20, color: '#fff',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 100,
};
const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16,
};
const statsGrid: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const closeStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#555', cursor: 'pointer',
  fontSize: 14, padding: '0 4px', flexShrink: 0,
};
const visualBar: React.CSSProperties = {
  display: 'flex', gap: 4, marginTop: 16, paddingTop: 12, borderTop: '1px solid #1a1a2e',
};
