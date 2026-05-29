import type { RawMusicData } from '@music-cosmos/domain';

export interface DataAdapter {
  readonly name: string;
  load(source?: string): Promise<RawMusicData>;
}
