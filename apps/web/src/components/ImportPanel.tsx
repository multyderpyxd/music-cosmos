import { useState, useRef, useCallback } from 'react';
import { useCosmosStore } from '../stores/cosmos-store.js';
import { UploadIcon, CloseIcon, GalaxyIcon } from '@music-cosmos/ui';

interface ImportPanelProps {
  onClose: () => void;
}

type ImportStatus = 'idle' | 'dragging' | 'loading' | 'success' | 'error';

interface DetectedFormat {
  name: 'stats.fm' | 'spotify' | 'unknown';
  label: string;
  color: string;
}

function detectFormat(content: string): DetectedFormat {
  try {
    const parsed: unknown = JSON.parse(content.slice(0, 2000));
    if (Array.isArray(parsed)) {
      const first = (parsed as Record<string, unknown>[])[0];
      if (first && 'master_metadata_track_name' in first) {
        return { name: 'spotify', label: 'Spotify Extended History', color: '#1DB954' };
      }
    } else if (typeof parsed === 'object' && parsed !== null && 'streams' in (parsed as object)) {
      return { name: 'stats.fm', label: 'stats.fm export', color: '#FF6B35' };
    }
  } catch { /* not JSON */ }
  return { name: 'unknown', label: 'Unknown format', color: '#475569' };
}

export function ImportPanel({ onClose }: ImportPanelProps) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [detected, setDetected] = useState<DetectedFormat | null>(null);
  const [fileName, setFileName] = useState('');
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
      setProgressMsg(`Detected ${fmt.label} · Normalizing…`);
      await importFile(file);
      setStatus('success');
      setTimeout(onClose, 1600);
    } catch { setStatus('error'); }
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

  const isDragging = status === 'dragging';
  const isLoading  = status === 'loading';
  const isSuccess  = status === 'success';
  const isError    = status === 'error';

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: '#f1f5f9', margin: 0, letterSpacing: -0.3 }}>
              Import music data
            </h2>
            <p style={{ fontSize: 11, color: '#334155', margin: '4px 0 0', letterSpacing: 0.2 }}>
              Processed locally · nothing leaves your device
            </p>
          </div>
          <button className="cosmos-modal-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={12} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          style={{
            border: `1px dashed ${isDragging ? '#818cf8' : isSuccess ? '#34d399' : isError ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10,
            padding: '32px 24px',
            textAlign: 'center',
            cursor: isLoading || isSuccess ? 'default' : 'pointer',
            background: isDragging ? 'rgba(129,140,248,0.06)' : 'rgba(255,255,255,0.02)',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onDragOver={(e) => { e.preventDefault(); if (!isLoading && !isSuccess) setStatus('dragging'); }}
          onDragLeave={() => setStatus(isLoading ? 'loading' : isSuccess ? 'success' : 'idle')}
          onDrop={handleDrop}
          onClick={() => { if (!isLoading && !isSuccess) fileInputRef.current.click(); }}
        >
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileInput} />

          {(status === 'idle' || isDragging) && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: isDragging ? '#818cf8' : '#334155' }}>
                <UploadIcon size={28} />
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                {isDragging ? 'Release to import' : 'Drop your export file here'}
              </p>
              <p style={{ fontSize: 11, color: '#1e293b', marginTop: 4 }}>or click to browse · .json</p>
            </>
          )}

          {isLoading && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#818cf8', animation: 'cosmos-spin 3s linear infinite' }}>
                <GalaxyIcon size={28} />
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{progressMsg}</p>
              {detected && <p style={{ fontSize: 10, color: detected.color, marginTop: 6 }}>{detected.label} · {fileName}</p>}
              <style>{`@keyframes cosmos-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
            </>
          )}

          {isSuccess && (
            <>
              <div style={{ fontSize: 28, marginBottom: 12, color: '#34d399' }}>✓</div>
              <p style={{ fontSize: 13, color: '#34d399', margin: 0 }}>Your cosmos is ready</p>
              {detected && <p style={{ fontSize: 10, color: '#334155', marginTop: 6 }}>{detected.label} · {fileName}</p>}
            </>
          )}

          {isError && (
            <>
              <div style={{ fontSize: 11, color: '#f87171', marginBottom: 8 }}>Import failed</div>
              <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{error ?? 'Could not read this file'}</p>
              <p style={{ fontSize: 10, color: '#334155', marginTop: 6 }}>Check the format guides below</p>
            </>
          )}
        </div>

        {/* Format guides */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <FormatCard
            name="stats.fm"
            accentColor="#FF6B35"
            steps={['Go to stats.fm → Settings', 'Scroll to "Export data"', 'Click Export → download JSON', 'Drop that file here']}
          />
          <FormatCard
            name="Spotify Extended History"
            accentColor="#1DB954"
            steps={['spotify.com → Account → Privacy', '"Request extended streaming history"', 'Wait up to 30 days for email', 'Unzip → drop any .json file']}
            note="Up to 30 days to receive"
          />
        </div>

        {/* Privacy */}
        <div style={privacyStyle}>
          All processing is local. Your listening history is never uploaded.
        </div>
      </div>
    </div>
  );
}

function FormatCard({ name, accentColor, steps, note }: { name: string; accentColor: string; steps: string[]; note?: string }) {
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: `1px solid ${accentColor}22`, borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: accentColor, marginBottom: 8 }}>{name}</div>
      <ol style={{ margin: 0, paddingLeft: 16, listStyle: 'decimal' }}>
        {steps.map((s, i) => <li key={i} style={{ fontSize: 10, color: '#334155', marginBottom: 3, lineHeight: 1.5 }}>{s}</li>)}
      </ol>
      {note && <p style={{ fontSize: 9, color: '#1e293b', marginTop: 7, fontStyle: 'italic' }}>{note}</p>}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 500,
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const panelStyle: React.CSSProperties = {
  width: 580, maxWidth: '94vw',
  background: 'rgba(3, 3, 12, 0.98)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: 28,
  color: '#fff',
  boxShadow: '0 24px 72px rgba(0,0,0,0.85)',
};

const privacyStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '9px 12px',
  background: 'rgba(52,211,153,0.05)',
  border: '1px solid rgba(52,211,153,0.12)',
  borderRadius: 7,
  fontSize: 10, color: '#334155', letterSpacing: 0.2,
};
