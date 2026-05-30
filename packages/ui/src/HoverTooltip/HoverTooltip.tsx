import { useState, useEffect } from 'react';
import { GalaxyIcon, StarIcon, PlanetIcon, MoonIcon, AsteroidIcon } from '../icons/Icons.js';

interface HoverTooltipProps {
  label: string | null;
  entityType?: string;
}

function TypeIcon({ type }: { type?: string }) {
  if (!type) return null;
  const s = 12;
  switch (type) {
    case 'galaxy':        return <GalaxyIcon size={s} />;
    case 'star':          return <StarIcon size={s} />;
    case 'planet':        return <PlanetIcon size={s} />;
    case 'satellite':     return <MoonIcon size={s} />;
    case 'asteroid-belt': return <AsteroidIcon size={s} />;
    default: return null;
  }
}

export function HoverTooltip({ label, entityType }: HoverTooltipProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  if (!label) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x + 16,
        top: pos.y - 12,
        background: 'rgba(3, 3, 12, 0.94)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: 7,
        padding: '5px 11px',
        color: '#cbd5e1',
        fontSize: 12,
        pointerEvents: 'none',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        letterSpacing: 0.2,
      }}
    >
      {entityType && (
        <span style={{ color: '#475569', display: 'flex' }}>
          <TypeIcon type={entityType} />
        </span>
      )}
      {label}
    </div>
  );
}
