import { useState, useEffect } from 'react';

interface HoverTooltipProps {
  label: string | null;
  entityType?: string;
}

const ICONS: Record<string, string> = {
  galaxy: '🌌', star: '⭐', planet: '🪐', satellite: '🌙', 'asteroid-belt': '💫',
};

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
        left: pos.x + 14,
        top: pos.y - 10,
        background: 'rgba(5, 5, 20, 0.9)',
        border: '1px solid #2a2a5f',
        borderRadius: 8,
        padding: '5px 10px',
        color: '#ddd',
        fontSize: 13,
        pointerEvents: 'none',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {entityType && <span style={{ fontSize: 14 }}>{ICONS[entityType] ?? '◦'}</span>}
      {label}
    </div>
  );
}
