import type { PlaylistId, TrackId } from '../ids/ids.js';

export interface Playlist {
  readonly id: PlaylistId;
  name: string;
  description?: string;
  trackIds: TrackId[];
  createdAt: Date;
  updatedAt: Date;
}
