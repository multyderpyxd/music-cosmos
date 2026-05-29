import type { ViewMode } from '@music-cosmos/config';

interface ViewModeSelectorProps {
  current: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const MODES: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'universe', label: 'Universe', icon: '🌌' },
  { id: 'galaxy',   label: 'Galaxy',   icon: '💫' },
  { id: 'artist',   label: 'Artist',   icon: '⭐' },
  { id: 'album',    label: 'Album',    icon: '🪐' },
];

export function ViewModeSelector({ current, onChange }: ViewModeSelectorProps) {
  return (
    <div style={containerStyle}>
      {MODES.map(({ id, label, icon }) => (
        <button
          key={id}
          style={{ ...btnStyle, ...(current === id ? activeBtnStyle : {}) }}
          onClick={() => onChange(id)}
          title={label}
        >
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 11 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 4,
  background: 'rgba(5, 5, 20, 0.85)',
  border: '1px solid #1e1e3f',
  borderRadius: 40,
  padding: '6px 8px',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  zIndex: 100,
};

const btnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  background: 'none',
  border: '1px solid transparent',
  borderRadius: 28,
  padding: '8px 16px',
  color: '#666',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const activeBtnStyle: React.CSSProperties = {
  background: 'rgba(107, 72, 255, 0.2)',
  borderColor: '#6B48FF',
  color: '#fff',
};
