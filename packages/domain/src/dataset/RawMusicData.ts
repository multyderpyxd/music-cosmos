import type { ExternalIds } from '../value-objects/ExternalIds.js';

export interface RawListeningEvent {
  trackTitle: string;
  artistName: string;
  albumTitle?: string;
  playedAt: Date;
  durationPlayedMs: number;
  externalIds?: ExternalIds;
  genreHint?: string;
}

export interface RawMusicData {
  source: string;
  importedAt: Date;
  events: RawListeningEvent[];
}
