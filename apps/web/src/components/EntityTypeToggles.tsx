interface EntityTypeTogglesProps {
  activeTypes: Set<string>;
  onToggle: (type: string) => void;
  galaxyParticleOpacity: number;
  onParticleOpacityChange: (v: number) => void;
}

const TOGGLES = [
  { type: 'galaxy',   label: 'Galaxies', icon: '🌌' },
  { type: 'star',     label: 'Stars',    icon: '⭐' },
  { type: 'planet',   label: 'Planets',  icon: '🪐' },
  { type: 'satellite',label: 'Moons',    icon: '🌙' },
] as const;

const OPACITY_STEPS = [0, 0.25, 0.55, 0.85];

export function EntityTypeToggles({
  activeTypes,
  onToggle,
  galaxyParticleOpacity,
  onParticleOpacityChange,
}: EntityTypeTogglesProps) {
  const showAll = activeTypes.size === 0;

  function nextOpacity() {
    const idx = OPACITY_STEPS.findIndex((v) => Math.abs(v - galaxyParticleOpacity) < 0.05);
    const next = OPACITY_STEPS[(idx + 1) % OPACITY_STEPS.length];
    onParticleOpacityChange(next ?? 0.55);
  }

  return (
    <div style={containerStyle}>
      {TOGGLES.map(({ type, label, icon }) => {
        const isActive = !showAll && activeTypes.has(type);
        const isVisible = showAll || activeTypes.has(type);
        return (
          <button
            key={type}
            title={showAll ? `Show only ${label}` : (isActive ? `Add ${label} / deselect` : `Add ${label}`)}
            style={{
              ...btnStyle,
              background: isActive
                ? 'rgba(107,72,255,0.25)'
                : 'none',
              border: isActive
                ? '1px solid rgba(107,72,255,0.7)'
                : '1px solid transparent',
              color: isVisible ? '#ddd' : '#333',
              opacity: isVisible ? 1 : 0.45,
            }}
            onClick={() => onToggle(type)}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 10, marginTop: 2 }}>{label}</span>
          </button>
        );
      })}

      {/* Galaxy nebula particle opacity toggle */}
      <div style={dividerStyle} />
      <button
        title={`Galaxy nebula opacity: ${Math.round(galaxyParticleOpacity * 100)}%\nClick to cycle`}
        style={{
          ...btnStyle,
          opacity: galaxyParticleOpacity === 0 ? 0.4 : 1,
          color: '#888',
          fontSize: 11,
          gap: 2,
          minWidth: 46,
        }}
        onClick={nextOpacity}
      >
        <span style={{ fontSize: 16 }}>✦</span>
        <span style={{ fontSize: 9 }}>{Math.round(galaxyParticleOpacity * 100)}%</span>
      </button>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  background: 'rgba(5, 5, 20, 0.85)',
  border: '1px solid #1e1e3f',
  borderRadius: 40,
  padding: '5px 8px',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  zIndex: 100,
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const btnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  background: 'none',
  border: '1px solid transparent',
  borderRadius: 28,
  padding: '7px 13px',
  color: '#999',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 28,
  background: '#1e1e3f',
  margin: '0 4px',
};
