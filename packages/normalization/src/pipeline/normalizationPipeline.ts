import {
  genreId,
  artistId,
  albumId,
  trackId,
} from '@music-cosmos/domain';
import type {
  RawMusicData,
  RawListeningEvent,
  MusicDataset,
  Genre,
  Artist,
  Album,
  Track,
  ListeningEvent,
} from '@music-cosmos/domain';
import { genreAliasMap, fallbackGenreId } from '@music-cosmos/config';
import { normalizeArtistName, normalizeTrackTitle, normalizeAlbumTitle } from '../dedupe/artistNormalizer.js';
import { aggregateStats } from '../metrics/metricsAggregator.js';

export interface NormalizationConfig {
  genreAliasMap?: Map<string, string>;
  fallbackGenre?: string;
}

export function normalize(raw: RawMusicData, config: NormalizationConfig = {}): MusicDataset {
  const aliasMap = config.genreAliasMap ?? genreAliasMap;
  const fallback = config.fallbackGenre ?? fallbackGenreId;

  const genres = new Map<ReturnType<typeof genreId>, Genre>();
  const artists = new Map<ReturnType<typeof artistId>, Artist>();
  const albums = new Map<ReturnType<typeof albumId>, Album>();
  const tracks = new Map<ReturnType<typeof trackId>, Track>();
  const events: ListeningEvent[] = [];

  const artistKeyToId = new Map<string, ReturnType<typeof artistId>>();
  const trackKeyToId = new Map<string, ReturnType<typeof trackId>>();
  const albumKeyToId = new Map<string, ReturnType<typeof albumId>>();

  function getOrCreateArtist(name: string): ReturnType<typeof artistId> {
    const key = normalizeArtistName(name);
    const existing = artistKeyToId.get(key);
    if (existing !== undefined) return existing;

    const id = artistId(`a:${key.replace(/\s+/g, '-')}`);
    artistKeyToId.set(key, id);
    const gId = genreId(fallback);
    if (!genres.has(gId)) {
      genres.set(gId, { id: gId, name: 'Unknown', aliases: [], externalIds: {} });
    }
    artists.set(id, {
      id,
      name,
      normalizedName: key,
      primaryGenreId: gId,
      genreIds: [gId],
      aliases: [],
      externalIds: {},
      isUnknown: false,
    });
    return id;
  }

  function getOrCreateAlbum(
    title: string | undefined,
    aId: ReturnType<typeof artistId>,
  ): ReturnType<typeof albumId> | undefined {
    if (!title) return undefined;
    const key = `${String(aId)}::${normalizeAlbumTitle(title)}`;
    const existing = albumKeyToId.get(key);
    if (existing !== undefined) return existing;

    const id = albumId(`al:${String(aId)}-${normalizeAlbumTitle(title).replace(/\s+/g, '-')}`);
    albumKeyToId.set(key, id);
    albums.set(id, {
      id,
      title,
      artistId: aId,
      type: 'unknown',
      genreIds: [],
      trackIds: [],
      externalIds: {},
      isUnknown: false,
    });
    return id;
  }

  function getOrCreateTrack(
    raw: RawListeningEvent,
    aId: ReturnType<typeof artistId>,
    alId: ReturnType<typeof albumId> | undefined,
  ): ReturnType<typeof trackId> {
    const key = `${String(aId)}::${normalizeTrackTitle(raw.trackTitle)}`;
    const existing = trackKeyToId.get(key);
    if (existing !== undefined) return existing;

    const id = trackId(`t:${String(aId)}-${normalizeTrackTitle(raw.trackTitle).replace(/\s+/g, '-')}`);
    trackKeyToId.set(key, id);
    tracks.set(id, {
      id,
      title: raw.trackTitle,
      artistId: aId,
      albumId: alId,
      durationMs: raw.durationPlayedMs > 0 ? raw.durationPlayedMs : undefined,
      genreIds: [],
      externalIds: raw.externalIds ?? {},
      isUnknown: false,
    });
    if (alId) {
      const album = albums.get(alId);
      if (album && !album.trackIds.includes(id)) {
        album.trackIds.push(id);
      }
    }
    return id;
  }

  let eventCounter = 0;
  for (const rawEvent of raw.events) {
    const aId = getOrCreateArtist(rawEvent.artistName);
    const alId = getOrCreateAlbum(rawEvent.albumTitle, aId);
    const tId = getOrCreateTrack(rawEvent, aId, alId);

    events.push({
      id: `ev:${eventCounter++}`,
      trackId: tId,
      artistId: aId,
      albumId: alId,
      playedAt: rawEvent.playedAt,
      durationPlayedMs: rawEvent.durationPlayedMs,
      sourceAdapter: raw.source,
    });
  }

  const stats = aggregateStats(events, genres, artists, albums, tracks);

  const datasetId = `${raw.source}-${raw.importedAt.toISOString()}-${events.length}`;
  return {
    id: datasetId,
    genres,
    artists,
    albums,
    tracks,
    stats,
    events,
    computedAt: new Date(),
    sourceAdapter: raw.source,
  };
}
