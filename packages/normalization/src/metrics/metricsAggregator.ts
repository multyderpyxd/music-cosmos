import type {
  ListeningEvent,
  ListeningStats,
  Genre,
  Artist,
  Album,
  Track,
  GenreId,
  ArtistId,
  AlbumId,
  TrackId,
} from '@music-cosmos/domain';

const THIRTY_DAYS_MS = 30 * 86_400_000;
const NINETY_DAYS_MS = 90 * 86_400_000;
const THREE_SIXTY_FIVE_DAYS_MS = 365 * 86_400_000;

export function aggregateStats(
  events: ListeningEvent[],
  genres: Map<GenreId, Genre>,
  artists: Map<ArtistId, Artist>,
  albums: Map<AlbumId, Album>,
  tracks: Map<TrackId, Track>,
): Map<string, ListeningStats> {
  const now = new Date();
  const stats = new Map<string, ListeningStats>();

  function getOrInit(
    entityId: GenreId | ArtistId | AlbumId | TrackId,
    entityType: 'genre' | 'artist' | 'album' | 'track',
    firstPlayed: Date,
  ): ListeningStats {
    const key = String(entityId);
    const existing = stats.get(key);
    if (existing) return existing;
    const s: ListeningStats = {
      entityId,
      entityType,
      totalPlays: 0,
      totalMinutes: 0,
      firstPlayedAt: firstPlayed,
      lastPlayedAt: firstPlayed,
      playsLast30Days: 0,
      playsLast90Days: 0,
      playsLast365Days: 0,
    };
    stats.set(key, s);
    return s;
  }

  for (const event of events) {
    const track = tracks.get(event.trackId);
    const artist = artists.get(event.artistId);
    const album = event.albumId !== undefined ? albums.get(event.albumId) : undefined;

    const msPlayed = event.durationPlayedMs;
    const minutesPlayed = msPlayed / 60_000;
    const playedAt = event.playedAt;
    const msSincePlay = now.getTime() - playedAt.getTime();

    const is30d = msSincePlay <= THIRTY_DAYS_MS;
    const is90d = msSincePlay <= NINETY_DAYS_MS;
    const is365d = msSincePlay <= THREE_SIXTY_FIVE_DAYS_MS;

    function update(s: ListeningStats): void {
      s.totalPlays += 1;
      s.totalMinutes += minutesPlayed;
      if (playedAt < s.firstPlayedAt) s.firstPlayedAt = playedAt;
      if (playedAt > s.lastPlayedAt) s.lastPlayedAt = playedAt;
      if (is30d) s.playsLast30Days += 1;
      if (is90d) s.playsLast90Days += 1;
      if (is365d) s.playsLast365Days += 1;
    }

    if (track) update(getOrInit(track.id, 'track', playedAt));
    if (artist) update(getOrInit(artist.id, 'artist', playedAt));
    if (album) update(getOrInit(album.id, 'album', playedAt));

    if (artist) {
      for (const gId of artist.genreIds) {
        const genre = genres.get(gId);
        if (genre) update(getOrInit(genre.id, 'genre', playedAt));
      }
    }
  }

  return stats;
}
