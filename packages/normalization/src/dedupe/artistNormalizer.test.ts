import { describe, it, expect } from 'vitest';
import { normalizeArtistName } from './artistNormalizer.js';

describe('normalizeArtistName', () => {
  it('lowercases', () => expect(normalizeArtistName('Burial')).toBe('burial'));
  it('collapses extra whitespace', () => expect(normalizeArtistName('  Four   Tet  ')).toBe('four tet'));
  it('handles all-caps', () => expect(normalizeArtistName('RADIOHEAD')).toBe('radiohead'));
  it('makes same-artist different-casing equal', () => {
    expect(normalizeArtistName('Radiohead')).toBe(normalizeArtistName('RADIOHEAD'));
    expect(normalizeArtistName('Kendrick Lamar')).toBe(normalizeArtistName('kendrick lamar'));
  });
});
