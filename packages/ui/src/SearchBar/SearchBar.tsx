import { useState, useCallback } from 'react';
import { SearchIcon, GalaxyIcon, StarIcon, PlanetIcon, MoonIcon, AsteroidIcon } from '../icons/Icons.js';

interface SearchResult {
  id: string;
  label: string;
  entityType: string;
}

interface SearchBarProps {
  results: SearchResult[];
  onSearch: (query: string) => void;
  onSelect: (nodeId: string) => void;
}

function EntityIcon({ type }: { type: string }) {
  const s = 13;
  switch (type) {
    case 'galaxy':        return <GalaxyIcon size={s} />;
    case 'star':          return <StarIcon size={s} />;
    case 'planet':        return <PlanetIcon size={s} />;
    case 'satellite':     return <MoonIcon size={s} />;
    case 'asteroid-belt': return <AsteroidIcon size={s} />;
    default: return null;
  }
}

const TYPE_LABEL: Record<string, string> = {
  galaxy: 'Genre', star: 'Artist', planet: 'Album',
  satellite: 'Track', 'asteroid-belt': 'Hidden',
};

export function SearchBar({ results, onSearch, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onSearch(q);
    setOpen(q.length > 0);
  }, [onSearch]);

  const handleSelect = useCallback((id: string) => {
    onSelect(id);
    setQuery('');
    setOpen(false);
  }, [onSelect]);

  return (
    <div style={containerStyle}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 12, color: '#334155', display: 'flex', pointerEvents: 'none' }}>
          <SearchIcon size={14} />
        </span>
        <input
          style={inputStyle}
          placeholder="Search artists, albums, tracks…"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          aria-label="Search cosmos entities"
          aria-autocomplete="list"
          aria-expanded={open}
        />
      </div>

      {open && results.length > 0 && (
        <div style={dropdownStyle} role="listbox">
          {results.slice(0, 10).map((r) => (
            <button
              key={r.id}
              className="cosmos-search-item"
              style={itemBaseStyle}
              onMouseDown={() => handleSelect(r.id)}
              role="option"
              aria-selected={false}
            >
              <span style={{ color: '#334155', display: 'flex', flexShrink: 0 }}>
                <EntityIcon type={r.entityType} />
              </span>
              <span style={{ fontSize: 12, color: '#cbd5e1', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.label}
              </span>
              <span style={{ fontSize: 10, color: '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0, fontFamily: 'inherit' }}>
                {TYPE_LABEL[r.entityType] ?? r.entityType}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16, left: '50%',
  transform: 'translateX(-50%)',
  width: 340,
  zIndex: 100,
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(5, 5, 20, 0.88)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 10,
  padding: '9px 16px 9px 36px',
  color: '#e2e8f0',
  fontSize: 12,
  outline: 'none',
  backdropFilter: 'blur(14px)',
  boxSizing: 'border-box',
  letterSpacing: 0.2,
};

const dropdownStyle: React.CSSProperties = {
  marginTop: 4,
  background: 'rgba(3, 3, 12, 0.96)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 10,
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
};

const itemBaseStyle: React.CSSProperties = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
};
