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
  GenreEvidence,
} from '@music-cosmos/domain';
import { genreAliasMap, fallbackGenreId } from '@music-cosmos/config';
import { normalizeArtistName, normalizeTrackTitle, normalizeAlbumTitle } from '../dedupe/artistNormalizer.js';
import { aggregateStats } from '../metrics/metricsAggregator.js';

export interface NormalizationConfig {
  genreAliasMap?: Map<string, string>;
  fallbackGenre?: string;
}

/** Resolve primary genre from GenreEvidence[] or legacy genreHint string. */
function resolveGenreFromEvidence(
  evidence: GenreEvidence[] | undefined,
  hint: string | undefined,
  aliasMap: Map<string, string>,
  fallback: string,
): ReturnType<typeof genreId> {
  // Try genreEvidence first (new path)
  if (evidence && evidence.length > 0) {
    // Pick highest-confidence evidence
    const best = [...evidence].sort((a, b) => b.weight * b.confidence - a.weight * a.confidence)[0];
    if (best) {
      const name = best.normalizedName || best.rawName.toLowerCase().trim();
      const resolved = aliasMap.get(name);
      if (resolved) return genreId(resolved);
    }
  }
  // Fall back to legacy genreHint
  if (hint) {
    const resolved = aliasMap.get(hint.toLowerCase().trim());
    if (resolved) return genreId(resolved);
  }
  return genreId(fallback);
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

  // Fallback name for streams where artistName couldn't be resolved
  const PARTIAL_ARTIST_NAME = 'Unknown Artist';

  function ensureGenre(gId: ReturnType<typeof genreId>, name: string): void {
    if (!genres.has(gId)) {
      genres.set(gId, { id: gId, name, aliases: [], externalIds: {} });
    }
  }

  function getOrCreateArtist(
    name: string,
    genreEvidence?: GenreEvidence[],
    genreHint?: string,
    isPartial = false,
  ): ReturnType<typeof artistId> {
    const key = normalizeArtistName(name);
    const existing = artistKeyToId.get(key);

    if (existing !== undefined) {
      // Upgrade genre if this event brings better genre evidence
      const hasEvidence = (genreEvidence && genreEvidence.length > 0) || genreHint;
      if (hasEvidence) {
        const artist = artists.get(existing);
        if (artist && String(artist.primaryGenreId) === fallback) {
          const gId = resolveGenreFromEvidence(genreEvidence, genreHint, aliasMap, fallback);
          const genreName = genreEvidence?.[0]?.rawName ?? genreHint ?? 'Unknown';
          ensureGenre(gId, genreName);
          artist.primaryGenreId = gId;
          artist.genreIds = [gId];
        }
      }
      return existing;
    }

    const id = artistId(`a:${key.replace(/\s+/g, '-')}`);
    artistKeyToId.set(key, id);
    const gId = resolveGenreFromEvidence(genreEvidence, genreHint, aliasMap, fallback);
    const genreName = genreEvidence?.[0]?.rawName ?? genreHint ?? 'Unknown';
    ensureGenre(gId, genreName);
    artists.set(id, {
      id,
      name,
      normalizedName: key,
      primaryGenreId: gId,
      genreIds: [gId],
      aliases: [],
      externalIds: {},
      isUnknown: isPartial,
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
    rawEvent: RawListeningEvent,
    aId: ReturnType<typeof artistId>,
    alId: ReturnType<typeof albumId> | undefined,
  ): ReturnType<typeof trackId> {
    const key = `${String(aId)}::${normalizeTrackTitle(rawEvent.trackTitle)}`;
    const existing = trackKeyToId.get(key);
    if (existing !== undefined) return existing;

    const id = trackId(
      `t:${String(aId)}-${normalizeTrackTitle(rawEvent.trackTitle).replace(/\s+/g, '-')}`,
    );
    trackKeyToId.set(key, id);
    tracks.set(id, {
      id,
      title: rawEvent.trackTitle,
      artistId: aId,
      albumId: alId,
      durationMs: rawEvent.durationPlayedMs > 0 ? rawEvent.durationPlayedMs : undefined,
      genreIds: [],
      externalIds: rawEvent.externalIds ?? {},
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

  // ── Ingest real listening events ────────────────────────────────────────────
  let eventCounter = 0;
  for (const rawEvent of raw.events) {
    // artistName is now optional. Partial events (no artist) get a fallback.
    const isPartial = !rawEvent.artistName;
    const resolvedArtistName = rawEvent.artistName?.trim() || PARTIAL_ARTIST_NAME;

    const aId = getOrCreateArtist(
      resolvedArtistName,
      rawEvent.genreEvidence,
      rawEvent.genreHint,
      isPartial,
    );
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

  // ── Ingest profile signals (rankings, followed, etc.) ────────────────────────
  // Signals create entities but do NOT contribute to ListeningStats.
  // They ensure artists/tracks from signals appear in the dataset
  // even if they have no real listening events (e.g. stats.fm with streams=null).
  for (const signal of raw.profileSignals ?? []) {
    if (!signal.artistName) continue;

    // Create artist entity from signal (may already exist from events above)
    getOrCreateArtist(
      signal.artistName,
      signal.genreEvidence,
      undefined,
      false,
    );
  }

  // ── Aggregate stats (ONLY from real listening events) ───────────────────────
  const stats = aggregateStats(events, genres, artists, albums, tracks);

  const datasetId = `${raw.source}-${raw.importedAt.toISOString()}-${events.length}-${raw.profileSignals?.length ?? 0}`;
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
