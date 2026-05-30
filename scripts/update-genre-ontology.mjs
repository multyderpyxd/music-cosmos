/**
 * update-genre-ontology.mjs
 *
 * Downloads the canonical MusicBrainz genre list and saves it as a generated
 * JSON file that can be used to validate / expand the local genre taxonomy.
 *
 * Usage: node scripts/update-genre-ontology.mjs
 * Add to package.json scripts: "genres:update": "node scripts/update-genre-ontology.mjs"
 *
 * MusicBrainz rate limit: max 1 request/second without auth.
 * This script makes a single request so it's fine.
 *
 * The output is informational — review before manually updating genre-taxonomy.ts.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../packages/config/src/generated');
const OUT_FILE = join(OUT_DIR, 'musicbrainz-genres.generated.json');

const MB_URL = 'https://musicbrainz.org/ws/2/genre/all?fmt=txt';
const USER_AGENT = 'music-cosmos/0.1.0 (https://github.com/multyderpyxd/music-cosmos)';

async function main() {
  console.log('Fetching MusicBrainz genre list...');

  const response = await fetch(MB_URL, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz genre fetch failed: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const genres = text
    .split('\n')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const unique = [...new Set(genres)];

  await mkdir(OUT_DIR, { recursive: true });

  const output = {
    generatedAt: new Date().toISOString(),
    source: MB_URL,
    count: unique.length,
    genres: unique,
  };

  await writeFile(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`✓ Written ${unique.length} genres to ${OUT_FILE}`);
  console.log('\nNext steps:');
  console.log('  1. Review the generated file');
  console.log('  2. Cross-reference with packages/config/src/genre-taxonomy.ts');
  console.log('  3. Add missing genres/aliases to the taxonomy as needed');
  console.log('  4. Commit the updated taxonomy (not the generated file)');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
