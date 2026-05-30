import { useState } from 'react';
import {
  InfoIcon, CloseIcon,
  GalaxyIcon, StarIcon, PlanetIcon, MoonIcon, AsteroidIcon,
} from '../icons/Icons.js';

const ENTITIES = [
  { icon: GalaxyIcon, label: 'Galaxy',        desc: 'Genre' },
  { icon: StarIcon,   label: 'Star',          desc: 'Artist' },
  { icon: PlanetIcon, label: 'Planet',        desc: 'Album' },
  { icon: MoonIcon,   label: 'Moon',          desc: 'Track' },
  { icon: AsteroidIcon, label: 'Asteroid belt', desc: 'Hidden tracks' },
];

const ENCODINGS = [
  { symbol: 'S', label: 'Size',        desc: 'Total plays / listening time' },
  { symbol: 'L', label: 'Brightness',  desc: 'Recent listening (90-day decay)' },
  { symbol: 'R', label: 'Orbit radius', desc: 'Album age — older orbits farther' },
  { symbol: 'V', label: 'Orbit speed',  desc: 'Recent play frequency' },
  { symbol: 'C', label: 'Color',        desc: 'Genre / stellar temperature' },
];

export function VisualLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 100, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <button
        className={`cosmos-legend-toggle${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close visual legend' : 'Open visual legend'}
        title="Visual legend"
      >
        {open ? <CloseIcon size={14} /> : <InfoIcon size={14} />}
      </button>

      {open && (
        <div style={panelStyle}>
          <p style={sectionLabel}>Entities</p>
          {ENTITIES.map(({ icon: Icon, label, desc }) => (
            <div key={label} style={rowStyle}>
              <span style={iconCell}><Icon size={13} /></span>
              <span style={rowLabel}>{label}</span>
              <span style={rowDesc}>{desc}</span>
            </div>
          ))}

          <p style={{ ...sectionLabel, marginTop: 14 }}>Visual encoding</p>
          {ENCODINGS.map(({ symbol, label, desc }) => (
            <div key={label} style={rowStyle}>
              <span style={{ ...iconCell, color: '#818cf8', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>
                {symbol}
              </span>
              <span style={rowLabel}>{label}</span>
              <span style={rowDesc}>{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 44,
  left: 0,
  width: 290,
  background: 'rgba(3, 3, 12, 0.96)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 12,
  padding: '14px 16px',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 9, color: '#334155',
  textTransform: 'uppercase', letterSpacing: 2,
  margin: '0 0 8px',
};

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  gap: 8, padding: '3px 0',
};

const iconCell: React.CSSProperties = {
  width: 18, color: '#475569', display: 'flex', flexShrink: 0,
};

const rowLabel: React.CSSProperties = {
  fontSize: 11, color: '#94a3b8', width: 90, flexShrink: 0,
};

const rowDesc: React.CSSProperties = {
  fontSize: 10, color: '#334155',
};
