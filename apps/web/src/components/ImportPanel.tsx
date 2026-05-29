import { useState, useRef, useCallback } from 'react';
import { useCosmosStore } from '../stores/cosmos-store.js';

interface ImportPanelProps {
  onClose: () => void;
}

type ImportStatus = 'idle' | 'dragging' | 'loading' | 'success' | 'error';

interface DetectedFormat {
  name: 'stats.fm' | 'spotify' | 'unknown';
  icon: string;
  color: string;
}

function detectFormat(content: string): DetectedFormat {
  try {
    const parsed: unknown = JSON.parse(content.slice(0, 2000)); // check start only
    if (Array.isArray(parsed)) {
      // Spotify: array of stream entries
      const first = (parsed as Record<string, unknown>[])[0];
      if (first && 'master_metadata_track_name' in first) {
        return { name: 'spotify', icon: '🎵', color: '#1DB954' };
      }
    } else if (typeof parsed === 'object' && parsed !== null) {
      // stats.fm: object with streams array
      if ('streams' in (parsed as object)) {
        return { name: 'stats.fm', icon: '📊', color: '#FF6B35' };
      }
    }
  } catch {
    // not JSON
  }
  return { name: 'unknown', icon: '❓', color: '#888' };
}

export function ImportPanel({ onClose }: ImportPanelProps) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [detected, setDetected] = useState<DetectedFormat | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const importFile = useCosmosStore((s) => s.importFile);
  const error = useCosmosStore((s) => s.error);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setProgressMsg('Reading file…');
    setStatus('loading');

    try {
      const content = await file.text();
      const fmt = detectFormat(content);
      setDetected(fmt);
      setProgressMsg(`Detected ${fmt.name === 'unknown' ? 'unknown format' : fmt.name} · Normalizing…`);
      await importFile(file);
      setStatus('success');
      setTimeout(onClose, 1800);
    } catch {
      setStatus('error');
    }
  }, [importFile, onClose]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus('idle');
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  }, [processFile]);

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: 0 }}>Import your music data</h2>
            <p style={{ fontSize: 12, color: '#555', margin: '4px 0 0' }}>
              Processed entirely in your browser · nothing leaves your device
            </p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Drop zone */}
        <div
          style={{
            ...dropZoneStyle,
            borderColor: status === 'dragging' ? '#6B48FF' : status === 'success' ? '#34D399' : status === 'error' ? '#EF4444' : '#1e1e3f',
            background: status === 'dragging' ? 'rgba(107,72,255,0.08)' : 'rgba(5,5,20,0.5)',
          }}
          onDragOver={(e) => { e.preventDefault(); setStatus('dragging'); }}
          onDragLeave={() => setStatus('idle')}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />

          {status === 'idle' || status === 'dragging' ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>
                {status === 'dragging' ? '📂' : '📁'}
              </div>
              <p style={{ fontSize: 15, color: '#aaa', margin: 0 }}>
                Drop your export file here
              </p>
              <p style={{ fontSize: 12, color: '#444', marginTop: 6 }}>
                or click to browse · accepts .json
              </p>
            </>
          ) : status === 'loading' ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🌌</div>
              <p style={{ fontSize: 14, color: '#aaa', margin: 0 }}>{progressMsg}</p>
              {detected && (
                <p style={{ fontSize: 12, color: detected.color, marginTop: 6 }}>
                  {detected.icon} {detected.name} · {fileName}
                </p>
              )}
              <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
            </>
          ) : status === 'success' ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 15, color: '#34D399', margin: 0 }}>Your cosmos is ready</p>
              {detected && (
                <p style={{ fontSize: 12, color: '#555', marginTop: 6 }}>
                  {detected.icon} {detected.name} · {fileName}
                </p>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ fontSize: 14, color: '#EF4444', margin: 0 }}>
                {error ?? 'Could not read this file'}
              </p>
              <p style={{ fontSize: 12, color: '#555', marginTop: 8 }}>
                Check the format guide below and try again
              </p>
            </>
          )}
        </div>

        {/* Format guides */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <FormatCard
            icon="📊"
            name="stats.fm"
            color="#FF6B35"
            steps={[
              'Go to stats.fm → Settings',
              'Scroll to "Export data"',
              'Click "Export" → download JSON',
              'Drop that file here',
            ]}
          />
          <FormatCard
            icon="🎵"
            name="Spotify Extended History"
            color="#1DB954"
            steps={[
              'spotify.com → Account → Privacy',
              '"Request extended streaming history"',
              'Wait up to 30 days for the email',
              'Unzip and drop any .json file',
            ]}
            note="Takes up to 30 days to receive"
          />
        </div>

        {/* Privacy notice */}
        <div style={privacyStyle}>
          🔒 <strong>Privacy:</strong> All data processing happens locally in your browser.
          Your listening history is never uploaded anywhere.
          Closing the tab permanently removes all loaded data.
        </div>

      </div>
    </div>
  );
}

function FormatCard({
  icon, name, color, steps, note,
}: {
  icon: string; name: string; color: string; steps: string[]; note?: string;
}) {
  return (
    <div style={{ ...cardStyle, borderColor: `${color}33` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{name}</span>
      </div>
      <ol style={{ margin: 0, paddingLeft: 18, listStyle: 'decimal' }}>
        {steps.map((s, i) => (
          <li key={i} style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{s}</li>
        ))}
      </ol>
      {note && (
        <p style={{ fontSize: 10, color: '#444', marginTop: 8, margin: '8px 0 0', fontStyle: 'italic' }}>
          ⚠ {note}
        </p>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 500,
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const panelStyle: React.CSSProperties = {
  width: 640, maxWidth: '95vw',
  background: 'rgba(8,8,28,0.97)',
  border: '1px solid #1e1e3f',
  borderRadius: 16,
  padding: 32,
  color: '#fff',
  boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
};

const dropZoneStyle: React.CSSProperties = {
  border: '2px dashed',
  borderRadius: 12,
  padding: 40,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  userSelect: 'none',
};

const cardStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(5,5,20,0.6)',
  border: '1px solid',
  borderRadius: 10,
  padding: '14px 16px',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #1e1e3f',
  borderRadius: '50%',
  width: 32, height: 32,
  color: '#555', cursor: 'pointer',
  fontSize: 14, flexShrink: 0,
};

const privacyStyle: React.CSSProperties = {
  marginTop: 20,
  padding: '10px 14px',
  background: 'rgba(52,211,153,0.06)',
  border: '1px solid rgba(52,211,153,0.2)',
  borderRadius: 8,
  fontSize: 12, color: '#888', lineHeight: 1.6,
};
