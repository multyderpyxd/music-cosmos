import type { RawMusicData, RawListeningEvent } from '@music-cosmos/domain';
import type { DataAdapter } from '../contract/DataAdapter.js';

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function makeEvents(
  artistName: string,
  trackTitle: string,
  albumTitle: string,
  count: number,
  startDaysAgo: number,
  intervalDays: number,
  durationMs: number,
): RawListeningEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    artistName,
    trackTitle,
    albumTitle,
    playedAt: daysAgo(startDaysAgo - i * intervalDays),
    durationPlayedMs: durationMs,
  }));
}

const MOCK_EVENTS: RawListeningEvent[] = [
  ...makeEvents('Burial', 'Archangel', 'Untrue', 40, 300, 7, 215_000),
  ...makeEvents('Burial', 'Shell of Light', 'Untrue', 25, 280, 11, 349_000),
  ...makeEvents('Burial', 'Ghost Hardware', 'Untrue', 18, 260, 14, 289_000),
  ...makeEvents('Burial', 'Near Dark', 'Burial', 15, 700, 46, 301_000),
  ...makeEvents('Burial', 'South London Boroughs', 'Burial', 8, 680, 85, 178_000),
  ...makeEvents('Aphex Twin', 'Xtal', 'Selected Ambient Works', 22, 400, 18, 318_000),
  ...makeEvents('Aphex Twin', 'Tha', 'Selected Ambient Works', 14, 380, 27, 264_000),
  ...makeEvents('Aphex Twin', 'Flim', 'Come to Daddy', 30, 100, 3, 206_000),
  ...makeEvents('Four Tet', 'Angel Echoes', 'There Is Love in You', 18, 200, 11, 361_000),
  ...makeEvents('Four Tet', 'Love Cry', 'There Is Love in You', 12, 190, 15, 370_000),
  ...makeEvents('Radiohead', 'Paranoid Android', 'OK Computer', 30, 500, 16, 383_000),
  ...makeEvents('Radiohead', 'Karma Police', 'OK Computer', 22, 480, 21, 263_000),
  ...makeEvents('Radiohead', 'No Surprises', 'OK Computer', 18, 460, 25, 228_000),
  ...makeEvents('Radiohead', 'Everything in Its Right Place', 'Kid A', 20, 400, 20, 259_000),
  ...makeEvents('Radiohead', 'How to Disappear Completely', 'Kid A', 12, 380, 31, 355_000),
  ...makeEvents('Radiohead', 'Idioteque', 'Kid A', 16, 420, 26, 260_000),
  ...makeEvents('Kendrick Lamar', 'Alright', 'To Pimp a Butterfly', 35, 200, 5, 219_000),
  ...makeEvents('Kendrick Lamar', 'King Kunta', 'To Pimp a Butterfly', 28, 190, 6, 234_000),
  ...makeEvents('Kendrick Lamar', 'The Blacker the Berry', 'To Pimp a Butterfly', 20, 180, 9, 337_000),
  ...makeEvents('Kendrick Lamar', 'Money Trees', 'good kid, m.A.A.d city', 25, 600, 24, 386_000),
  ...makeEvents('Kendrick Lamar', 'Swimming Pools', 'good kid, m.A.A.d city', 18, 580, 32, 311_000),
];

export class MockDataAdapter implements DataAdapter {
  readonly name = 'mock';

  async load(_source?: string): Promise<RawMusicData> {
    return {
      source: 'mock',
      importedAt: new Date(),
      events: MOCK_EVENTS,
    };
  }
}
