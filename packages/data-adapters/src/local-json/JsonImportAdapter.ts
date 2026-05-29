import type { RawMusicData } from '@music-cosmos/domain';
import type { DataAdapter } from '../contract/DataAdapter.js';

export class JsonImportAdapter implements DataAdapter {
  readonly name = 'json-import';

  async load(jsonContent?: string): Promise<RawMusicData> {
    if (!jsonContent) throw new Error('JsonImportAdapter requires JSON content string');

    const raw: unknown = JSON.parse(jsonContent);
    if (!this.isRawMusicData(raw)) {
      throw new Error('JSON does not match RawMusicData schema');
    }
    return raw;
  }

  private isRawMusicData(raw: unknown): raw is RawMusicData {
    if (typeof raw !== 'object' || raw === null) return false;
    const obj = raw as Record<string, unknown>;
    return typeof obj['source'] === 'string' && Array.isArray(obj['events']);
  }
}
