import type { RawMusicData, RawListeningEvent } from '@music-cosmos/domain';
import type { DataAdapter } from '../contract/DataAdapter.js';

interface StatsFmStream {
  endTime: string;
  artistName: string;
  trackName: string;
  msPlayed: number;
}

interface StatsFmExport {
  streams?: StatsFmStream[];
}

export class StatsFmImportAdapter implements DataAdapter {
  readonly name = 'statsfm';

  async load(jsonContent?: string): Promise<RawMusicData> {
    if (!jsonContent) throw new Error('StatsFmImportAdapter requires JSON content string');

    const raw: unknown = JSON.parse(jsonContent);
    if (!this.isStatsFmExport(raw)) {
      throw new Error('Invalid stats.fm export format');
    }

    const events: RawListeningEvent[] = (raw.streams ?? [])
      .filter((s) => s.msPlayed >= 30_000)
      .map((s) => ({
        trackTitle: s.trackName,
        artistName: s.artistName,
        playedAt: new Date(s.endTime),
        durationPlayedMs: s.msPlayed,
      }));

    return { source: 'statsfm', importedAt: new Date(), events };
  }

  private isStatsFmExport(raw: unknown): raw is StatsFmExport {
    if (typeof raw !== 'object' || raw === null) return false;
    const obj = raw as Record<string, unknown>;
    if (!Array.isArray(obj['streams'])) return false;
    return true;
  }
}
