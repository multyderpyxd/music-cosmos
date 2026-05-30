import { GalaxyIcon, StarIcon, PlanetIcon, MoonIcon, SparkleIcon } from '@music-cosmos/ui';

interface EntityTypeTogglesProps {
  activeTypes: Set<string>;
  onToggle: (type: string) => void;
  galaxyParticleOpacity: number;
  onParticleOpacityChange: (v: number) => void;
}

const TOGGLES = [
  { type: 'galaxy',    label: 'Galaxies', Icon: GalaxyIcon },
  { type: 'star',      label: 'Stars',    Icon: StarIcon },
  { type: 'planet',    label: 'Planets',  Icon: PlanetIcon },
  { type: 'satellite', label: 'Moons',    Icon: MoonIcon },
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
    const next = OPACITY_STEPS[(idx + 1) % OPACITY_STEPS.length] ?? 0.55;
    onParticleOpacityChange(next);
  }

  return (
    <div style={barStyle} aria-label="Entity visibility filters">
      {TOGGLES.map(({ type, label, Icon }) => {
        const isActive = !showAll && activeTypes.has(type);
        const isDimmed = !showAll && !activeTypes.has(type);
        return (
          <button
            key={type}
            className={`ui-toggle-btn${isActive ? ' is-active' : ''}${isDimmed ? ' is-dimmed' : ''}`}
            onClick={() => onToggle(type)}
            aria-pressed={isActive}
            aria-label={isActive ? `Remove ${label} filter` : `Show only ${label}`}
            title={showAll ? `Filter to ${label} only` : (isActive ? `Deselect ${label}` : `Add ${label}`)}
          >
            <Icon size={14} />
            <span style={{ fontSize: 11, letterSpacing: 0.3 }}>{label}</span>
          </button>
        );
      })}

      <span style={divStyle} role="separator" aria-hidden />

      <button
        className="ui-particle-btn"
        onClick={nextOpacity}
        aria-label={`Galaxy nebula opacity ${Math.round(galaxyParticleOpacity * 100)}%, click to cycle`}
        title={`Nebula opacity: ${Math.round(galaxyParticleOpacity * 100)}%`}
      >
        <SparkleIcon size={12} />
        <span style={{ fontSize: 10, letterSpacing: 0.5, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(galaxyParticleOpacity * 100)}%
        </span>
      </button>
    </div>
  );
}

const barStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 24, left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  background: 'rgba(5, 5, 20, 0.88)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 999,
  padding: '4px 6px',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  zIndex: 100,
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const divStyle: React.CSSProperties = {
  width: 1, height: 20,
  background: 'rgba(255, 255, 255, 0.06)',
  margin: '0 4px',
  flexShrink: 0,
};
