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
  AffinityStats,
  MetricBasis,
} from '@music-cosmos/domain';
import { fallbackGenreId, ALL_GENRES } from '@music-cosmos/config';
import { normalizeArtistName, normalizeTrackTitle, normalizeAlbumTitle } from '../dedupe/artistNormalizer.js';
import { aggregateStats } from '../metrics/metricsAggregator.js';
import { resolveGenres } from '../genre/GenreResolver.js';

export interface NormalizationConfig {
  /** @deprecated Use the built-in FULL_GENRE_ALIAS_MAP from config. Kept for test overrides. */
  genreAliasMap?: Map<string, string>;
  fallbackGenre?: string;
}


export function normalize(raw: RawMusicData, config: NormalizationConfig = {}): MusicDataset {
  const fallback = config.fallbackGenre ?? fallbackGenreId;

  const genres = new Map<ReturnType<typeof genreId>, Genre>();
  const artists = new Map<ReturnType<typeof artistId>, Artist>();
  const albums = new Map<ReturnType<typeof albumId>, Album>();
  const tracks = new Map<ReturnType<typeof trackId>, Track>();
  const events: ListeningEvent[] = [];

  const artistKeyToId = new Map<string, ReturnType<typeof artistId>>();
  const trackKeyToId = new Map<string, ReturnType<typeof trackId>>();
  const albumKeyToId = new Map<string, ReturnType<typeof albumId>>();

  // Pre-populate genres from the full taxonomy so all known genres are available
  for (const g of ALL_GENRES) {
    const gId = genreId(g.id);
    genres.set(gId, { id: gId, name: g.name, aliases: g.aliases, externalIds: {} });
  }

  const PARTIAL_ARTIST_NAME = 'Unknown Artist';
  const FALLBACK_GENRE_ID = genreId(fallback);

  function getOrCreateArtist(
    name: string,
    genreEvidence?: GenreEvidence[],
    genreHint?: string,
    isPartial = false,
  ): ReturnType<typeof artistId> {
    const key = normalizeArtistName(name);
    const existing = artistKeyToId.get(key);

    if (existing !== undefined) {
      // Upgrade genre if this event brings better evidence and artist was unknown
      const hasEvidence = (genreEvidence && genreEvidence.length > 0) || genreHint;
      if (hasEvidence) {
        const artist = artists.get(existing);
        if (artist && String(artist.primaryGenreId) === fallback) {
          const resolved = resolveGenres(genreEvidence ?? [], genreHint);
          if (!resolved.usedFallback) {
            artist.primaryGenreId = resolved.primaryGenreId;
            artist.genreIds = resolved.genreIds;
          }
        }
      }
      return existing;
    }

    const id = artistId(`a:${key.replace(/\s+/g, '-')}`);
    artistKeyToId.set(key, id);
    const resolved = resolveGenres(genreEvidence ?? [], genreHint);
    artists.set(id, {
      id,
      name,
      normalizedName: key,
      primaryGenreId: resolved.usedFallback ? FALLBACK_GENRE_ID : resolved.primaryGenreId,
      genreIds: resolved.usedFallback ? [FALLBACK_GENRE_ID] : resolved.genreIds,
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
  // Signals create artist entities but do NOT contribute to ListeningStats.
  for (const signal of raw.profileSignals ?? []) {
    if (!signal.artistName) continue;
    getOrCreateArtist(signal.artistName, signal.genreEvidence, undefined, false);
  }

  // ── Aggregate stats (ONLY from real listening events) ───────────────────────
  const stats = aggregateStats(events, genres, artists, albums, tracks);

  // ── Compute AffinityStats from profileSignals ────────────────────────────────
  // Separate from ListeningStats — must never be used as play counts.
  const affinityStats = new Map<string, AffinityStats>();
  const artistsWithRealEvents = new Set(events.map((e) => String(e.artistId)));

  for (const signal of raw.profileSignals ?? []) {
    if (!signal.artistName || !signal.affinityScore) continue;

    const key = signal.artistName.trim();
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '-');
    const aId = artistKeyToId.get(key.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim())
              ?? artistKeyToId.get(normalizedKey);

    // Find the artist ID by name match
    let entityId: string | undefined;
    for (const [k, id] of artistKeyToId) {
      // Match by normalized artist name
      if (k.includes(normalizedKey) || normalizedKey.includes(k)) {
        entityId = String(id);
        break;
      }
    }
    // Also try exact match
    if (!entityId) {
      const exactKey = key.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
      entityId = artistKeyToId.has(exactKey) ? String(artistKeyToId.get(exactKey)!) : undefined;
    }
    if (!entityId) continue;

    const hasRealEvents = artistsWithRealEvents.has(entityId);
    const existing = affinityStats.get(entityId);

    const basis = {
      source: signal.kind,
      range: signal.range,
      contribution: signal.affinityScore,
      position: signal.position,
    };

    if (existing) {
      existing.score += signal.affinityScore;
      existing.scoreBasis.push(basis);
      if (hasRealEvents) existing.hasRealListeningEvents = true;
      // Update metricBasis
      const metricBasis: MetricBasis =
        existing.hasRealListeningEvents ? 'mixed' : 'profile-affinity';
      existing.metricBasis = metricBasis;
    } else {
      const metricBasis: MetricBasis = hasRealEvents ? 'mixed' : 'profile-affinity';
      affinityStats.set(entityId, {
        entityId,
        entityType: 'artist',
        score: signal.affinityScore,
        scoreBasis: [basis],
        hasRealListeningEvents: hasRealEvents,
        metricBasis,
      });
    }
  }

  const datasetId = `${raw.source}-${raw.importedAt.toISOString()}-${events.length}-${raw.profileSignals?.length ?? 0}`;
  return {
    id: datasetId,
    genres,
    artists,
    albums,
    tracks,
    stats,
    affinityStats: affinityStats.size > 0 ? affinityStats : undefined,
    events,
    computedAt: new Date(),
    sourceAdapter: raw.source,
    dataQuality: raw.importDiagnostics,
  };
}
