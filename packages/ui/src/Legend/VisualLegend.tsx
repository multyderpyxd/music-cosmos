import { useState } from 'react';

export function VisualLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div style={containerStyle}>
      <button style={toggleStyle} onClick={() => setOpen((v) => !v)} title="Visual legend">
        {open ? '✕' : 'ℹ'}
      </button>
      {open && (
        <div style={panelStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#9B59B6' }}>
            Visual Language
          </h3>

          <Section title="Entities">
            <Row icon="🌌" label="Galaxy" desc="Genre" />
            <Row icon="⭐" label="Star" desc="Artist" />
            <Row icon="🪐" label="Planet" desc="Album" />
            <Row icon="🌙" label="Satellite" desc="Track" />
            <Row icon="💫" label="Asteroid belt" desc="Hidden tracks" />
          </Section>

          <Section title="Encoding">
            <Row icon="📏" label="Size" desc="Total plays / listening time" />
            <Row icon="✨" label="Brightness" desc="Recent listening (30-day decay)" />
            <Row icon="📡" label="Orbit radius" desc="Album age (older → farther)" />
            <Row icon="⚡" label="Orbit speed" desc="Recent play frequency" />
            <Row icon="🎨" label="Color" desc="Genre / stellar temperature" />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 14, width: 20 }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#bbb', width: 90 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#666' }}>{desc}</span>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 80,
  left: 16,
  zIndex: 100,
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const toggleStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: 'rgba(5, 5, 20, 0.85)',
  border: '1px solid #1e1e3f',
  color: '#888',
  cursor: 'pointer',
  fontSize: 14,
  backdropFilter: 'blur(12px)',
};

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 44,
  left: 0,
  width: 280,
  background: 'rgba(5, 5, 20, 0.95)',
  border: '1px solid #1e1e3f',
  borderRadius: 12,
  padding: 16,
  color: '#fff',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
};
