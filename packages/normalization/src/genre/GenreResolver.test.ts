import { describe, it, expect } from 'vitest';
import { resolveGenres } from './GenreResolver.js';
import type { GenreEvidence } from '@music-cosmos/domain';

function ev(rawName: string, source: GenreEvidence['source'] = 'statsfm', weight = 0.85, confidence = 0.85): GenreEvidence {
  return { rawName, normalizedName: rawName.toLowerCase(), source, weight, confidence };
}

describe('GenreResolver', () => {
  // ── Macro-genre resolution ────────────────────────────────────────────────
  it('resolves "alternative" → g:alternative-rock (sub) with parent g:rock', () => {
    const result = resolveGenres([ev('alternative')]);
    expect(String(result.primaryGenreId)).toBe('g:alternative-rock');
    expect(result.usedFallback).toBe(false);
    // Parent g:rock should appear as secondary due to parent credit
    const ids = result.genreIds.map(String);
    expect(ids).toContain('g:rock');
  });

  it('resolves "alternative rock" as alias for g:alternative-rock', () => {
    const result = resolveGenres([ev('alternative rock')]);
    expect(String(result.primaryGenreId)).toBe('g:alternative-rock');
  });

  it('resolves "indie" → g:indie-rock', () => {
    const result = resolveGenres([ev('indie')]);
    expect(String(result.primaryGenreId)).toBe('g:indie-rock');
  });

  it('resolves "hip hop" → g:hip-hop (macro)', () => {
    const result = resolveGenres([ev('hip hop')]);
    expect(String(result.primaryGenreId)).toBe('g:hip-hop');
  });

  it('resolves "rap" → g:hip-hop', () => {
    const result = resolveGenres([ev('rap')]);
    expect(String(result.primaryGenreId)).toBe('g:hip-hop');
  });

  it('resolves "j-pop" → g:j-pop with parent g:pop', () => {
    const result = resolveGenres([ev('j-pop')]);
    expect(String(result.primaryGenreId)).toBe('g:j-pop');
    expect(result.genreIds.map(String)).toContain('g:pop');
  });

  it('resolves "anime" → g:anime-ost (soundtrack context)', () => {
    // anime maps to g:anime-ost in the taxonomy
    const result = resolveGenres([ev('anime')]);
    expect(String(result.primaryGenreId)).toBe('g:anime-ost');
  });

  // ── Blacklist ─────────────────────────────────────────────────────────────
  it('ignores blacklisted tags (seen live, male vocalists)', () => {
    const result = resolveGenres([ev('seen live'), ev('male vocalists')]);
    expect(result.usedFallback).toBe(true);
    expect(String(result.primaryGenreId)).toBe('g:unknown');
  });

  it('ignores nationality tags', () => {
    const result = resolveGenres([ev('american'), ev('british')]);
    expect(result.usedFallback).toBe(true);
  });

  it('ignores decade tags', () => {
    const result = resolveGenres([ev('80s'), ev('90s')]);
    expect(result.usedFallback).toBe(true);
  });

  // ── Multi-source / multi-genre ───────────────────────────────────────────
  it('combines evidence from multiple sources', () => {
    const evidence = [
      ev('alternative rock', 'statsfm', 0.85, 0.9),
      ev('indie rock', 'spotify', 0.80, 0.8),
    ];
    const result = resolveGenres(evidence);
    // Should have at least g:rock, g:alternative-rock, g:indie-rock
    const ids = result.genreIds.map(String);
    expect(ids.length).toBeGreaterThan(1);
    expect(ids).toContain('g:alternative-rock');
  });

  it('returns up to 3 genre IDs', () => {
    const evidence = [
      ev('alternative rock'),
      ev('indie rock'),
      ev('post-rock'),
      ev('prog rock'),
    ];
    const result = resolveGenres(evidence);
    expect(result.genreIds.length).toBeLessThanOrEqual(3);
  });

  it('higher-weighted source wins over lower-weighted', () => {
    const highWeight = [ev('electronic', 'statsfm', 0.9, 0.9)];
    const lowWeight  = [ev('pop', 'lastfm', 0.5, 0.5)];
    const result = resolveGenres([...highWeight, ...lowWeight]);
    expect(String(result.primaryGenreId)).toBe('g:electronic');
  });

  // ── Legacy genreHint fallback ─────────────────────────────────────────────
  it('uses legacy genreHint when no genreEvidence', () => {
    const result = resolveGenres([], 'electronic');
    expect(String(result.primaryGenreId)).toBe('g:electronic');
    expect(result.usedFallback).toBe(false);
  });

  it('prefers genreEvidence over legacy genreHint', () => {
    const evidence = [ev('rock', 'statsfm', 0.9, 0.9)];
    const result = resolveGenres(evidence, 'pop');
    // statsfm rock evidence (weight 0.9) should win over taxonomy-alias pop (0.5)
    expect(String(result.primaryGenreId)).toBe('g:rock');
  });

  // ── Fallback to unknown ───────────────────────────────────────────────────
  it('returns g:unknown when no evidence resolves to a known genre', () => {
    const result = resolveGenres([ev('nonexistentgenrethatdoesnotexist')]);
    expect(result.usedFallback).toBe(true);
    expect(String(result.primaryGenreId)).toBe('g:unknown');
    expect(result.confidence).toBe(0);
  });

  it('returns g:unknown for empty evidence', () => {
    const result = resolveGenres([]);
    expect(result.usedFallback).toBe(true);
  });

  // ── Confidence ────────────────────────────────────────────────────────────
  it('confidence is between 0 and 1', () => {
    const result = resolveGenres([ev('rock')]);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  // ── Determinism ───────────────────────────────────────────────────────────
  it('is deterministic — same evidence produces same result', () => {
    const evidence = [ev('alternative rock'), ev('indie')];
    const r1 = resolveGenres(evidence);
    const r2 = resolveGenres(evidence);
    expect(String(r1.primaryGenreId)).toBe(String(r2.primaryGenreId));
    expect(r1.genreIds.map(String)).toEqual(r2.genreIds.map(String));
    expect(r1.confidence).toBe(r2.confidence);
  });

  // ── Spanish rock (from user's music taste) ───────────────────────────────
  it('resolves "rock transgresivo" → g:spanish-rock', () => {
    const result = resolveGenres([ev('rock transgresivo')]);
    expect(String(result.primaryGenreId)).toBe('g:spanish-rock');
  });

  it('resolves "spanish rock" → g:spanish-rock', () => {
    const result = resolveGenres([ev('spanish rock')]);
    expect(String(result.primaryGenreId)).toBe('g:spanish-rock');
  });
});
