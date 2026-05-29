import type { RawListeningEvent } from '@music-cosmos/domain';

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

export const rawEventFixtures: RawListeningEvent[] = [
  // Burial — Untrue (heavy recent listener)
  ...makeEvents('Burial', 'Archangel', 'Untrue', 40, 300, 7, 215_000),
  ...makeEvents('Burial', 'Shell of Light', 'Untrue', 25, 280, 11, 349_000),
  ...makeEvents('Burial', 'Ghost Hardware', 'Untrue', 18, 260, 14, 289_000),
  // Burial — self-titled (older listening)
  ...makeEvents('Burial', 'Near Dark', 'Burial', 15, 700, 46, 301_000),
  ...makeEvents('Burial', 'South London Boroughs', 'Burial', 8, 680, 85, 178_000),
  // Radiohead — OK Computer
  ...makeEvents('Radiohead', 'Paranoid Android', 'OK Computer', 30, 500, 16, 383_000),
  ...makeEvents('Radiohead', 'Karma Police', 'OK Computer', 22, 480, 21, 263_000),
  ...makeEvents('Radiohead', 'No Surprises', 'OK Computer', 18, 460, 25, 228_000),
  // Radiohead — Kid A
  ...makeEvents('Radiohead', 'Everything in Its Right Place', 'Kid A', 20, 400, 20, 259_000),
  ...makeEvents('Radiohead', 'How to Disappear Completely', 'Kid A', 12, 380, 31, 355_000),
  // Kendrick Lamar — TPAB
  ...makeEvents('Kendrick Lamar', 'Alright', 'To Pimp a Butterfly', 35, 200, 5, 219_000),
  ...makeEvents('Kendrick Lamar', 'King Kunta', 'To Pimp a Butterfly', 28, 190, 6, 234_000),
  ...makeEvents('Kendrick Lamar', 'The Blacker the Berry', 'To Pimp a Butterfly', 20, 180, 9, 337_000),
  // Some edge cases
  { artistName: 'BURIAL', trackTitle: 'Archangel', albumTitle: 'Untrue', playedAt: daysAgo(5), durationPlayedMs: 215_000 },
  { artistName: 'radiohead', trackTitle: 'Paranoid Android', playedAt: daysAgo(3), durationPlayedMs: 383_000 },
];
