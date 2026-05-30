/**
 * Normalizes a raw genre name / tag string for consistent lookup.
 * Strips diacritics, lowercases, collapses whitespace, removes trailing noise.
 */
export function normalizeGenreName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics (é→e, ñ→n, etc.)
    .replace(/[''`]/g, '')              // smart quotes
    .replace(/[^\w\s&/-]/g, ' ')        // keep alphanumeric + & / -
    .replace(/\s+/g, ' ')
    .trim();
}
