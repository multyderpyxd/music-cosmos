/**
 * StatsFmApiAdapter — converts stats.fm live API data into RawMusicData.
 *
 * INVARIANT: syntheticEventsCreated MUST be 0.
 * Rankings (topArtists, topTracks) are converted to ProfileSignal[],
 * NOT to RawListeningEvent[]. Play counts must never be invented from positions.
 *
 * recentStreams are treated as real events even when artistName cannot be
 * resolved (partial events are preserved with resolutionStatus='partial').
 */

import type {
  RawMusicData,
  RawListeningEvent,
  ResolutionStatus,
  ProfileSignal,
  DataProvenance,
  GenreEvidence,
  DataQualityReport,
} from '@music-cosmos/domain';

// Local structural type — mirrors StatsFmData from apps/web/src/lib/statsFmApi.ts
export interface StatsFmApiData {
  user: { customId: string };
  topArtists: Array<{
    position: number;
    streams: number | null;
    artist: {
      id: number;
      name: string;
      genres: string[];
      image?: string;
      followers?: number;
      spotifyPopularity?: number;
    };
  }>;
  topTracks: Array<{
    position: number;
    streams: number | null;
    track: {
      id: number;
      name: string;
      durationMs: number;
      artists: Array<{ id: number; name: string; image?: string }>;
      albums: Array<{ id: number; name: string; image?: string }>;
    };
  }>;
  recentStreams: Array<{
    id?: string;
    endTime: string;
    playedMs: number;
    trackId: number;
    trackName: string;
    albumId?: number;
    artistIds: number[];
  }>;
  fetchedAt: number;
}

/** Convert a ranking position to an affinity score. NOT plays — never plays. */
function affinityFromPosition(position: number): number {
  return Math.max(1, Math.round(150 / Math.pow(position, 0.55)));
}

function genreEvidenceFromStatsFm(genres: string[]): GenreEvidence[] {
  return genres.map((g) => ({
    rawName: g,
    normalizedName: g.toLowerCase().trim(),
    source: 'statsfm' as const,
    weight: 0.85,
    confidence: 0.85,
  }));
}

export class StatsFmApiAdapter {
  readonly name = 'statsfm-api';

  convert(data: StatsFmApiData): RawMusicData {
    const importedAt = new Date(data.fetchedAt);
    const baseProvenance: DataProvenance = {
      source: 'statsfm-stream',
      adapter: 'StatsFmApiAdapter',
      importedAt,
      confidence: 1,
    };

    // ── Build lookup indexes from topArtists ─────────────────────────────────
    const artistNameByStatsFmId = new Map<number, string>();
    const artistGenreEvidenceByStatsFmId = new Map<number, GenreEvidence[]>();
    const artistImageByStatsFmId = new Map<number, string | undefined>();

    for (const item of data.topArtists) {
      const { id, name, genres, image } = item.artist;
      artistNameByStatsFmId.set(id, name);
      artistGenreEvidenceByStatsFmId.set(id, genreEvidenceFromStatsFm(genres));
      artistImageByStatsFmId.set(id, image);
    }

    // ── Build lookup indexes from topTracks ──────────────────────────────────
    const topTrackByStatsFmId = new Map<number, StatsFmApiData['topTracks'][0]>();
    const topTrackByNormalizedName = new Map<string, StatsFmApiData['topTracks'][0]>();

    for (const item of data.topTracks) {
      topTrackByStatsFmId.set(item.track.id, item);
      const nameKey = item.track.name.toLowerCase().trim();
      if (!topTrackByNormalizedName.has(nameKey)) {
        topTrackByNormalizedName.set(nameKey, item);
      }
    }

    // ── 1. Process recentStreams as REAL listening events ─────────────────────
    // Partial events (no artistName) are PRESERVED, not dropped.
    const events: RawListeningEvent[] = [];
    let matchedById = 0;
    let matchedByName = 0;
    let unmatched = 0;
    let partialCount = 0;
    let resolvedCount = 0;

    for (const stream of data.recentStreams) {
      if (!stream.trackName || !stream.endTime) continue;

      const matchedByIdItem = topTrackByStatsFmId.get(stream.trackId);
      const matchedByNameItem = matchedByIdItem
        ? undefined
        : topTrackByNormalizedName.get(stream.trackName.toLowerCase().trim());
      const matchedTrack = matchedByIdItem ?? matchedByNameItem;

      if (matchedByIdItem) matchedById++;
      else if (matchedByNameItem) matchedByName++;
      else unmatched++;

      const primaryArtistId = stream.artistIds[0];
      const artistName: string | undefined =
        matchedTrack?.track.artists[0]?.name ??
        (primaryArtistId !== undefined
          ? artistNameByStatsFmId.get(primaryArtistId)
          : undefined);

      const genreEvidence: GenreEvidence[] =
        (primaryArtistId !== undefined
          ? artistGenreEvidenceByStatsFmId.get(primaryArtistId)
          : undefined) ?? [];

      const resolutionStatus: ResolutionStatus = artistName ? 'resolved' : 'partial';
      if (resolutionStatus === 'resolved') resolvedCount++;
      else partialCount++;

      events.push({
        trackTitle:       stream.trackName,
        artistName,                    // may be undefined — partial event, kept
        albumTitle:       matchedTrack?.track.albums[0]?.name,
        playedAt:         new Date(stream.endTime),
        durationPlayedMs:
          stream.playedMs > 0
            ? stream.playedMs
            : (matchedTrack?.track.durationMs ?? 0),
        trackExternalIds:  { statsfm: String(stream.trackId) },
        artistExternalIds: primaryArtistId !== undefined
          ? { statsfm: String(primaryArtistId) }
          : undefined,
        albumExternalIds:  stream.albumId !== undefined
          ? { statsfm: String(stream.albumId) }
          : undefined,
        genreEvidence,
        provenance: {
          ...baseProvenance,
          sourceRecordId: stream.id ?? String(stream.trackId),
          confidence: artistName ? 1 : 0.75,
        },
        resolutionStatus,
      });
    }

    // ── 2. Process topArtists → ProfileSignal[] (NOT events) ─────────────────
    const profileSignals: ProfileSignal[] = [];

    for (const item of data.topArtists) {
      profileSignals.push({
        kind: 'statsfm-top-artist',
        range: 'lifetime',
        artistName:   item.artist.name,
        position:     item.position,
        streamCount:  item.streams ?? undefined,
        affinityScore: affinityFromPosition(item.position),
        artistExternalIds: { statsfm: String(item.artist.id) },
        imageUrl:     item.artist.image,
        genreEvidence: genreEvidenceFromStatsFm(item.artist.genres),
        provenance: {
          source: 'statsfm-stream',
          adapter: 'StatsFmApiAdapter',
          importedAt,
          confidence: item.streams != null ? 0.9 : 0.7,
        },
      });
    }

    // ── 3. Process topTracks → ProfileSignal[] (NOT events) ──────────────────
    for (const item of data.topTracks) {
      const primaryArtistId = item.track.artists[0]?.id;
      const genreEv: GenreEvidence[] =
        (primaryArtistId !== undefined
          ? artistGenreEvidenceByStatsFmId.get(primaryArtistId)
          : undefined) ?? [];

      profileSignals.push({
        kind: 'statsfm-top-track',
        range: 'lifetime',
        trackTitle:   item.track.name,
        artistName:   item.track.artists[0]?.name,
        albumTitle:   item.track.albums[0]?.name,
        position:     item.position,
        streamCount:  item.streams ?? undefined,
        affinityScore: affinityFromPosition(item.position),
        trackExternalIds:  { statsfm: String(item.track.id) },
        artistExternalIds: primaryArtistId !== undefined
          ? { statsfm: String(primaryArtistId) }
          : undefined,
        genreEvidence: genreEv,
        provenance: {
          source: 'statsfm-stream',
          adapter: 'StatsFmApiAdapter',
          importedAt,
          confidence: item.streams != null ? 0.85 : 0.65,
        },
      });
    }

    // ── 4. DataQualityReport ──────────────────────────────────────────────────
    const artistsTotal = data.topArtists.length;
    const artistsWithGenre = data.topArtists.filter(
      (a) => a.artist.genres.length > 0,
    ).length;

    const warnings: string[] = [];
    if (unmatched > 0)
      warnings.push(`${unmatched} streams could not be matched to a known artist.`);
    if (data.topArtists.some((a) => a.streams === null))
      warnings.push(
        'streams=null: user has no imported Spotify history in stats.fm. ' +
        'Cosmos uses affinity signals from ranking positions, not exact play counts.',
      );

    const importDiagnostics: DataQualityReport = {
      importedAt,
      sourceAdapter: 'StatsFmApiAdapter',
      rawEvents:     data.recentStreams.length,
      realEvents:    resolvedCount,
      partialEvents: partialCount,
      unresolvedEvents: 0,
      profileSignals: profileSignals.length,
      rankingSignals: profileSignals.length,
      followedSignals: 0,
      syntheticEventsCreated: 0,   // invariant — never > 0 in this adapter
      tracksMatchedById:   matchedById,
      tracksMatchedByName: matchedByName,
      tracksUnmatched:     unmatched,
      artistsTotal,
      artistsWithGenre,
      artistsWithoutGenre: artistsTotal - artistsWithGenre,
      genreCoverageRatio:  artistsTotal > 0 ? artistsWithGenre / artistsTotal : 0,
      genresFromStatsFm:   artistsWithGenre,
      genresFromSpotify:   0,
      genresFromLastFm:    0,
      genresFromMusicBrainz: 0,
      genresUnknown: artistsTotal - artistsWithGenre,
      warnings,
    };

    return {
      source:     `statsfm-api:${data.user.customId}`,
      importedAt,
      events,
      profileSignals,
      importDiagnostics,
    };
  }
}
