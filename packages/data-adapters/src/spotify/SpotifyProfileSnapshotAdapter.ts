/**
 * SpotifyProfileSnapshotAdapter
 *
 * Processes a Spotify profile snapshot JSON containing top artists by term
 * and followed artists. Compatible with exports from tools like NewsletterAI.
 *
 * INVARIANT: produces ZERO listening events (syntheticEventsCreated=0).
 * All data goes into profileSignals[]. This is affinity data, not listening history.
 *
 * Scoring (ported from NewsletterAI parse_spotify.py):
 *   short_term:  base=150, min=101  → position 1 → 150, position 50 → 101
 *   medium_term: base=75,  min=26   → position 1 → 75,  position 50 → 26
 *   long_term:   base=25,  min=1    → position 1 → 25,  position 50 → 1
 *   followed:    flat +5 bonus
 *   short+medium bonus: +100 if appears in both short and medium term
 *
 * Accepted JSON format (single combined file):
 * {
 *   "importedAt": "2026-05-30T00:00:00Z",  // optional
 *   "topArtists": [
 *     { "term": "short_term", "position": 1, "id": "spotifyId", "name": "Artist",
 *       "genres": ["rock"], "popularity": 80, "imageUrl": "https://..." }
 *   ],
 *   "followedArtists": [
 *     { "id": "spotifyId", "name": "Artist", "genres": ["pop"] }
 *   ]
 * }
 */

import type { RawMusicData, ProfileSignal, GenreEvidence, DataQualityReport } from '@music-cosmos/domain';

export type SpotifyTerm = 'short_term' | 'medium_term' | 'long_term';

export interface SpotifyProfileTopArtist {
  term: SpotifyTerm;
  position: number;          // 1-based
  id: string;                // Spotify artist ID
  name: string;
  genres: string[];
  popularity?: number;
  imageUrl?: string;
}

export interface SpotifyProfileFollowedArtist {
  id: string;
  name: string;
  genres: string[];
  popularity?: number;
  imageUrl?: string;
}

export interface SpotifyProfileSnapshot {
  importedAt?: string;       // ISO 8601; optional, defaults to now
  topArtists: SpotifyProfileTopArtist[];
  followedArtists?: SpotifyProfileFollowedArtist[];
}

// ── Scoring constants (from NewsletterAI parse_spotify.py) ──────────────────

const TERM_CONFIG: Record<SpotifyTerm, { base: number; min: number }> = {
  short_term:  { base: 150, min: 101 },
  medium_term: { base: 75,  min: 26 },
  long_term:   { base: 25,  min: 1 },
};

const FOLLOWED_BONUS    = 5;
const SHORT_MEDIUM_BONUS = 100;

/** score for a 0-based position within a list of `total` items */
function scoreRank(posIdx: number, total: number, base: number, min: number): number {
  if (total <= 1) return base;
  return Math.round(base - ((base - min) * posIdx) / (total - 1));
}

function genreEvidenceFromSpotify(genres: string[]): GenreEvidence[] {
  return genres.map((g) => ({
    rawName: g,
    normalizedName: g.toLowerCase().trim(),
    source: 'spotify' as const,
    weight: 0.80,
    confidence: 0.80,
  }));
}

/** Detect if a JSON object matches SpotifyProfileSnapshot shape. */
export function isSpotifyProfileSnapshot(raw: unknown): raw is SpotifyProfileSnapshot {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj['topArtists'])) return false;
  const first = (obj['topArtists'] as unknown[])[0];
  if (!first || typeof first !== 'object') return false;
  const f = first as Record<string, unknown>;
  return typeof f['term'] === 'string' && typeof f['name'] === 'string';
}

export class SpotifyProfileSnapshotAdapter {
  readonly name = 'spotify-profile-snapshot';

  convert(snapshot: SpotifyProfileSnapshot): RawMusicData {
    const importedAt = snapshot.importedAt
      ? new Date(snapshot.importedAt)
      : new Date();

    const profileSignals: ProfileSignal[] = [];

    // ── Build lookup sets for bonus computation ───────────────────────────
    const shortTermIds  = new Set(snapshot.topArtists.filter((a) => a.term === 'short_term').map((a) => a.id));
    const mediumTermIds = new Set(snapshot.topArtists.filter((a) => a.term === 'medium_term').map((a) => a.id));
    const followedIds   = new Set((snapshot.followedArtists ?? []).map((a) => a.id));

    // ── Process topArtists by term ────────────────────────────────────────
    const artistsByTerm: Partial<Record<SpotifyTerm, SpotifyProfileTopArtist[]>> = {};
    for (const artist of snapshot.topArtists) {
      (artistsByTerm[artist.term] ??= []).push(artist);
    }

    for (const term of ['short_term', 'medium_term', 'long_term'] as SpotifyTerm[]) {
      const termArtists = artistsByTerm[term] ?? [];
      const cfg = TERM_CONFIG[term];
      const total = termArtists.length;

      for (const artist of termArtists) {
        const posIdx = artist.position - 1;   // convert to 0-based
        let score = scoreRank(posIdx, total, cfg.base, cfg.min);

        // Short+medium bonus: artist active across both recent windows
        if (term === 'short_term' && mediumTermIds.has(artist.id)) {
          score += SHORT_MEDIUM_BONUS;
        }

        // Followed bonus
        if (followedIds.has(artist.id)) {
          score += FOLLOWED_BONUS;
        }

        profileSignals.push({
          kind:  'spotify-top-artist',
          range: term,
          artistName: artist.name,
          position:   artist.position,
          affinityScore: score,
          artistExternalIds: { spotify: artist.id },
          imageUrl:   artist.imageUrl,
          popularity: artist.popularity,
          genreEvidence: genreEvidenceFromSpotify(artist.genres),
          provenance: {
            source:    'spotify-profile',
            adapter:   'SpotifyProfileSnapshotAdapter',
            importedAt,
            sourceRecordId: artist.id,
            confidence: 0.85,
          },
        });
      }
    }

    // ── Process followed artists ──────────────────────────────────────────
    for (const artist of snapshot.followedArtists ?? []) {
      // Only add as separate signal if not already in top lists
      const alreadyInTop = shortTermIds.has(artist.id) || mediumTermIds.has(artist.id);

      profileSignals.push({
        kind:  'spotify-followed-artist',
        range: 'unknown',
        artistName: artist.name,
        affinityScore: alreadyInTop ? FOLLOWED_BONUS : FOLLOWED_BONUS,
        artistExternalIds: { spotify: artist.id },
        imageUrl:   artist.imageUrl,
        popularity: artist.popularity,
        genreEvidence: genreEvidenceFromSpotify(artist.genres),
        provenance: {
          source:    'spotify-profile',
          adapter:   'SpotifyProfileSnapshotAdapter',
          importedAt,
          sourceRecordId: artist.id,
          confidence: 0.70,
        },
      });
    }

    const artistsWithGenre = new Set(
      snapshot.topArtists.filter((a) => a.genres.length > 0).map((a) => a.id),
    ).size;
    const artistsTotal = new Set(snapshot.topArtists.map((a) => a.id)).size;

    const importDiagnostics: DataQualityReport = {
      importedAt,
      sourceAdapter: 'SpotifyProfileSnapshotAdapter',
      rawEvents:   0,
      realEvents:  0,
      partialEvents: 0,
      unresolvedEvents: 0,
      profileSignals: profileSignals.length,
      rankingSignals: profileSignals.filter((s) => s.kind !== 'spotify-followed-artist').length,
      followedSignals: profileSignals.filter((s) => s.kind === 'spotify-followed-artist').length,
      syntheticEventsCreated: 0,     // invariant
      tracksMatchedById:   0,
      tracksMatchedByName: 0,
      tracksUnmatched:     0,
      artistsTotal,
      artistsWithGenre,
      artistsWithoutGenre: artistsTotal - artistsWithGenre,
      genreCoverageRatio: artistsTotal > 0 ? artistsWithGenre / artistsTotal : 0,
      genresFromStatsFm:   0,
      genresFromSpotify:   artistsWithGenre,
      genresFromLastFm:    0,
      genresFromMusicBrainz: 0,
      genresUnknown: artistsTotal - artistsWithGenre,
      warnings: [
        'Spotify profile contains no listening events — cosmos uses affinity scores from rankings.',
      ],
    };

    return {
      source:     'spotify-profile',
      importedAt,
      events:     [],              // NO events — affinity only
      profileSignals,
      importDiagnostics,
    };
  }
}
