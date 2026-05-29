import { useState, useCallback } from 'react';

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

const ICONS: Record<string, string> = {
  galaxy: '🌌',
  star: '⭐',
  planet: '🪐',
  satellite: '🌙',
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
      <input
        style={inputStyle}
        placeholder="Search artists, albums, tracks..."
        value={query}
        onChange={handleChange}
        onFocus={() => query.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <div style={dropdownStyle}>
          {results.slice(0, 10).map((r) => (
            <button
              key={r.id}
              style={resultStyle}
              onMouseDown={() => handleSelect(r.id)}
            >
              <span style={{ fontSize: 14 }}>{ICONS[r.entityType] ?? '◦'}</span>
              <span style={{ fontSize: 13, color: '#ccc' }}>{r.label}</span>
              <span style={{ fontSize: 10, color: '#555', marginLeft: 'auto' }}>{r.entityType}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 360,
  zIndex: 100,
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(5, 5, 20, 0.88)',
  border: '1px solid #1e1e3f',
  borderRadius: 24,
  padding: '10px 20px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  backdropFilter: 'blur(12px)',
  boxSizing: 'border-box',
};

const dropdownStyle: React.CSSProperties = {
  marginTop: 6,
  background: 'rgba(5, 5, 20, 0.95)',
  border: '1px solid #1e1e3f',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
};

const resultStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  background: 'none',
  border: 'none',
  padding: '10px 16px',
  cursor: 'pointer',
  color: '#fff',
  textAlign: 'left',
  borderBottom: '1px solid #0d0d1e',
};
