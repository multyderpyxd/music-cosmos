/**
 * genre-taxonomy.ts — local genre ontology for Music Cosmos.
 *
 * Structure:
 *   - Macro-genres: top-level galaxy entities (15 entries)
 *   - Sub-genres: specific genres that map to a parent macro-genre
 *
 * Aliases: alternative spellings / common Last.fm / Spotify tag names
 *   that resolve to the same genre ID.
 *
 * This file is the source of truth for genre resolution.
 * Supplements / replaces genre-map.ts.
 */

export interface GenreTaxonomyEntry {
  id: string;
  name: string;
  parentId?: string;
  aliases: string[];
}

// ── Macro-genres (become galaxies) ──────────────────────────────────────────

export const MACRO_GENRES: GenreTaxonomyEntry[] = [
  { id: 'g:rock',           name: 'Rock',           aliases: [] },
  { id: 'g:metal',          name: 'Metal',          aliases: ['heavy metal'] },
  { id: 'g:pop',            name: 'Pop',            aliases: [] },
  { id: 'g:electronic',     name: 'Electronic',     aliases: ['electronica', 'edm', 'electronic music'] },
  { id: 'g:hip-hop',        name: 'Hip-Hop',        aliases: ['hip hop', 'rap', 'hiphop'] },
  { id: 'g:rnb-soul-funk',  name: 'R&B / Soul',     aliases: ['r&b', 'rnb', 'soul', 'rhythm and blues'] },
  { id: 'g:jazz-blues',     name: 'Jazz & Blues',   aliases: ['jazz', 'blues'] },
  { id: 'g:classical',      name: 'Classical',      aliases: ['classical music'] },
  { id: 'g:folk-country',   name: 'Folk & Country', aliases: ['folk', 'country'] },
  { id: 'g:latin-iberian',  name: 'Latin & Iberian', aliases: ['latin', 'latin music'] },
  { id: 'g:punk-emo',       name: 'Punk & Emo',     aliases: ['punk'] },
  { id: 'g:experimental',   name: 'Experimental',   aliases: ['experimental music', 'avant-garde', 'avant garde'] },
  { id: 'g:soundtrack',     name: 'Soundtrack',     aliases: ['score', 'film score', 'ost'] },
  { id: 'g:world',          name: 'World',          aliases: ['world music'] },
  { id: 'g:unknown',        name: 'Unknown',        aliases: [] },
];

// ── Sub-genres (map to a parent macro) ──────────────────────────────────────

export const SUB_GENRES: GenreTaxonomyEntry[] = [
  // ── Rock ──────────────────────────────────────────────────────────────────
  { id: 'g:alternative-rock',   name: 'Alternative Rock',   parentId: 'g:rock',
    aliases: ['alternative', 'alt rock', 'alt-rock', 'modern rock'] },
  { id: 'g:indie-rock',         name: 'Indie Rock',         parentId: 'g:rock',
    aliases: ['indie', 'indie rock music'] },
  { id: 'g:post-rock',          name: 'Post-Rock',          parentId: 'g:rock',
    aliases: ['post rock', 'postrock'] },
  { id: 'g:grunge',             name: 'Grunge',             parentId: 'g:rock',
    aliases: ['seattle sound'] },
  { id: 'g:progressive-rock',   name: 'Progressive Rock',   parentId: 'g:rock',
    aliases: ['prog rock', 'prog-rock', 'prog', 'progressive'] },
  { id: 'g:math-rock',          name: 'Math Rock',          parentId: 'g:rock',
    aliases: ['mathrock', 'math rock music'] },
  { id: 'g:classic-rock',       name: 'Classic Rock',       parentId: 'g:rock',
    aliases: ['classic rock music'] },
  { id: 'g:hard-rock',          name: 'Hard Rock',          parentId: 'g:rock',
    aliases: ['hard rock music'] },
  { id: 'g:soft-rock',          name: 'Soft Rock',          parentId: 'g:rock',
    aliases: ['soft rock music', 'mellow rock'] },
  { id: 'g:shoegaze',           name: 'Shoegaze',           parentId: 'g:rock',
    aliases: ['shoegazing', 'shoegazer'] },
  { id: 'g:noise-rock',         name: 'Noise Rock',         parentId: 'g:rock',
    aliases: ['noise-rock', 'noisepop', 'noise pop'] },
  { id: 'g:psychedelic-rock',   name: 'Psychedelic Rock',   parentId: 'g:rock',
    aliases: ['psychedelic', 'psych rock', 'psychedelic music'] },
  { id: 'g:britpop',            name: 'Britpop',            parentId: 'g:rock',
    aliases: ['brit pop'] },
  { id: 'g:spanish-rock',       name: 'Spanish Rock',       parentId: 'g:latin-iberian',
    aliases: ['rock en espanol', 'rock español', 'rock transgresivo', 'rock iberica'] },

  // ── Metal ─────────────────────────────────────────────────────────────────
  { id: 'g:alternative-metal',  name: 'Alternative Metal',  parentId: 'g:metal',
    aliases: ['alt metal', 'alt-metal'] },
  { id: 'g:progressive-metal',  name: 'Progressive Metal',  parentId: 'g:metal',
    aliases: ['prog metal', 'prog-metal'] },
  { id: 'g:metalcore',          name: 'Metalcore',          parentId: 'g:metal',
    aliases: ['metal core', 'progressive metalcore'] },
  { id: 'g:nu-metal',           name: 'Nu-Metal',           parentId: 'g:metal',
    aliases: ['nu metal', 'nü-metal'] },
  { id: 'g:black-metal',        name: 'Black Metal',        parentId: 'g:metal',
    aliases: ['melodic black metal', 'symphonic black metal', 'progressive black metal'] },
  { id: 'g:death-metal',        name: 'Death Metal',        parentId: 'g:metal',
    aliases: ['technical death metal', 'melodic death metal', 'melo-death'] },
  { id: 'g:doom-metal',         name: 'Doom Metal',         parentId: 'g:metal',
    aliases: ['doom'] },
  { id: 'g:djent',              name: 'Djent',              parentId: 'g:metal',
    aliases: ['math metal', 'technical metal'] },
  { id: 'g:thrash-metal',       name: 'Thrash Metal',       parentId: 'g:metal',
    aliases: ['thrash', 'speed metal'] },
  { id: 'g:symphonic-metal',    name: 'Symphonic Metal',    parentId: 'g:metal',
    aliases: ['orchestral metal', 'cinematic metal'] },

  // ── Pop ───────────────────────────────────────────────────────────────────
  { id: 'g:indie-pop',          name: 'Indie Pop',          parentId: 'g:pop',
    aliases: ['indie pop music', 'lo-fi pop'] },
  { id: 'g:dream-pop',          name: 'Dream Pop',          parentId: 'g:pop',
    aliases: ['dreampop', 'dream-pop'] },
  { id: 'g:synth-pop',          name: 'Synth-Pop',          parentId: 'g:pop',
    aliases: ['synthpop', 'synth pop', 'electropop', 'electronic pop'] },
  { id: 'g:dance-pop',          name: 'Dance Pop',          parentId: 'g:pop',
    aliases: ['dancepop', 'dance-pop'] },
  { id: 'g:j-pop',              name: 'J-Pop',              parentId: 'g:pop',
    aliases: ['japanese pop', 'jpop', 'j pop'] },
  { id: 'g:k-pop',              name: 'K-Pop',              parentId: 'g:pop',
    aliases: ['korean pop', 'kpop', 'k pop'] },
  { id: 'g:art-pop',            name: 'Art Pop',            parentId: 'g:pop',
    aliases: ['artpop', 'art-pop', 'baroque pop'] },

  // ── Electronic ────────────────────────────────────────────────────────────
  { id: 'g:ambient',            name: 'Ambient',            parentId: 'g:electronic',
    aliases: ['dark ambient', 'ambient music', 'space ambient'] },
  { id: 'g:drone',              name: 'Drone',              parentId: 'g:electronic',
    aliases: ['drone music', 'drone ambient'] },
  { id: 'g:trip-hop',           name: 'Trip-Hop',           parentId: 'g:electronic',
    aliases: ['trip hop', 'triphop'] },
  { id: 'g:idm',                name: 'IDM',                parentId: 'g:electronic',
    aliases: ['intelligent dance music', 'braindance'] },
  { id: 'g:synthwave',          name: 'Synthwave',          parentId: 'g:electronic',
    aliases: ['retrowave', 'outrun', 'darksynth', 'vaporwave'] },
  { id: 'g:house',              name: 'House',              parentId: 'g:electronic',
    aliases: ['deep house', 'tech house', 'progressive house', 'acid house'] },
  { id: 'g:techno',             name: 'Techno',             parentId: 'g:electronic',
    aliases: ['industrial techno', 'minimal techno'] },
  { id: 'g:drum-and-bass',      name: 'Drum and Bass',      parentId: 'g:electronic',
    aliases: ['dnb', 'drum & bass', 'jungle'] },
  { id: 'g:chiptune',           name: 'Chiptune',           parentId: 'g:electronic',
    aliases: ['8-bit', 'chip music', 'video game music', 'game music', 'chiptune music'] },

  // ── Hip-Hop ───────────────────────────────────────────────────────────────
  { id: 'g:trap',               name: 'Trap',               parentId: 'g:hip-hop',
    aliases: ['trap music', 'trap rap'] },
  { id: 'g:lo-fi-hip-hop',      name: 'Lo-Fi Hip-Hop',      parentId: 'g:hip-hop',
    aliases: ['lo-fi', 'lofi', 'lo fi hip hop', 'chill hop', 'chillhop'] },
  { id: 'g:boom-bap',           name: 'Boom Bap',           parentId: 'g:hip-hop',
    aliases: ['boom-bap', 'east coast hip hop', 'underground hip hop'] },

  // ── R&B / Soul / Funk ─────────────────────────────────────────────────────
  { id: 'g:neo-soul',           name: 'Neo Soul',           parentId: 'g:rnb-soul-funk',
    aliases: ['neo-soul', 'contemporary r&b'] },
  { id: 'g:funk',               name: 'Funk',               parentId: 'g:rnb-soul-funk',
    aliases: ['funk music'] },
  { id: 'g:acid-jazz',          name: 'Acid Jazz',          parentId: 'g:rnb-soul-funk',
    aliases: ['acid-jazz'] },

  // ── Jazz & Blues ──────────────────────────────────────────────────────────
  { id: 'g:smooth-jazz',        name: 'Smooth Jazz',        parentId: 'g:jazz-blues',
    aliases: ['contemporary jazz'] },
  { id: 'g:bebop',              name: 'Bebop',              parentId: 'g:jazz-blues',
    aliases: ['bop'] },
  { id: 'g:jazz-fusion',        name: 'Jazz Fusion',        parentId: 'g:jazz-blues',
    aliases: ['fusion', 'jazz rock'] },

  // ── Classical ─────────────────────────────────────────────────────────────
  { id: 'g:contemporary-classical', name: 'Contemporary Classical', parentId: 'g:classical',
    aliases: ['modern classical', 'contemporary music', 'new music'] },
  { id: 'g:neo-classical',      name: 'Neoclassical',       parentId: 'g:classical',
    aliases: ['neo-classical', 'neoclassical music', 'neoclassical darkwave'] },
  { id: 'g:orchestral',         name: 'Orchestral',         parentId: 'g:classical',
    aliases: ['orchestral music', 'symphonic'] },
  { id: 'g:minimalism',         name: 'Minimalism',         parentId: 'g:classical',
    aliases: ['minimalist', 'minimalist music'] },
  { id: 'g:chamber',            name: 'Chamber Music',      parentId: 'g:classical',
    aliases: ['chamber'] },

  // ── Folk & Country ────────────────────────────────────────────────────────
  { id: 'g:singer-songwriter',  name: 'Singer-Songwriter',  parentId: 'g:folk-country',
    aliases: ['singer songwriter', 'acoustic', 'acoustic folk'] },
  { id: 'g:americana',          name: 'Americana',          parentId: 'g:folk-country',
    aliases: ['roots', 'roots rock', 'alt-country', 'alternative country'] },
  { id: 'g:bluegrass',          name: 'Bluegrass',          parentId: 'g:folk-country',
    aliases: ['bluegrass music'] },
  { id: 'g:celtic',             name: 'Celtic',             parentId: 'g:folk-country',
    aliases: ['celtic music', 'irish folk', 'scottish folk'] },

  // ── Latin & Iberian ───────────────────────────────────────────────────────
  { id: 'g:flamenco',           name: 'Flamenco',           parentId: 'g:latin-iberian',
    aliases: ['flamenco music'] },
  { id: 'g:reggaeton',          name: 'Reggaeton',          parentId: 'g:latin-iberian',
    aliases: ['reggaeton music', 'latin trap', 'latin urban'] },
  { id: 'g:bossa-nova',         name: 'Bossa Nova',         parentId: 'g:latin-iberian',
    aliases: ['bossa-nova', 'bossanova'] },
  { id: 'g:tango',              name: 'Tango',              parentId: 'g:latin-iberian',
    aliases: ['tango music', 'nuevo tango'] },

  // ── Punk & Emo ────────────────────────────────────────────────────────────
  { id: 'g:post-punk',          name: 'Post-Punk',          parentId: 'g:punk-emo',
    aliases: ['post punk', 'postpunk', 'gothic rock', 'goth rock', 'cold wave'] },
  { id: 'g:emo',                name: 'Emo',                parentId: 'g:punk-emo',
    aliases: ['emo music', 'emo pop', 'midwest emo'] },
  { id: 'g:pop-punk',           name: 'Pop Punk',           parentId: 'g:punk-emo',
    aliases: ['pop-punk', 'poppunk'] },
  { id: 'g:hardcore',           name: 'Hardcore',           parentId: 'g:punk-emo',
    aliases: ['hardcore punk', 'hardcore music', 'mathcore'] },

  // ── Experimental ──────────────────────────────────────────────────────────
  { id: 'g:noise',              name: 'Noise',              parentId: 'g:experimental',
    aliases: ['noise music', 'harsh noise', 'power electronics'] },
  { id: 'g:post-metal',         name: 'Post-Metal',         parentId: 'g:experimental',
    aliases: ['post metal', 'atmospheric sludge'] },
  { id: 'g:atmospheric',        name: 'Atmospheric',        parentId: 'g:experimental',
    aliases: ['atmospheric music', 'ethereal'] },

  // ── Soundtrack & Score ────────────────────────────────────────────────────
  { id: 'g:cinematic',          name: 'Cinematic',          parentId: 'g:soundtrack',
    aliases: ['cinematic music', 'epic music', 'trailer music'] },
  { id: 'g:anime-ost',          name: 'Anime OST',          parentId: 'g:soundtrack',
    aliases: ['anime', 'anime music', 'anime soundtrack', 'japanimé'] },

  // ── World ─────────────────────────────────────────────────────────────────
  { id: 'g:reggae',             name: 'Reggae',             parentId: 'g:world',
    aliases: ['reggae music', 'dancehall', 'ska'] },
  { id: 'g:afrobeat',           name: 'Afrobeat',           parentId: 'g:world',
    aliases: ['afro-beat', 'afropop', 'afrobeats'] },
  { id: 'g:j-rock',             name: 'J-Rock',             parentId: 'g:world',
    aliases: ['japanese rock', 'jrock', 'j rock', 'visual kei'] },
];

// ── Full ontology ─────────────────────────────────────────────────────────────

export const ALL_GENRES: GenreTaxonomyEntry[] = [...MACRO_GENRES, ...SUB_GENRES];

/** Build alias → genreId map from the full ontology. */
export function buildGenreAliasMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const g of ALL_GENRES) {
    map.set(g.name.toLowerCase(), g.id);
    for (const alias of g.aliases) {
      map.set(alias.toLowerCase(), g.id);
    }
  }
  return map;
}

export const FULL_GENRE_ALIAS_MAP: Map<string, string> = buildGenreAliasMap();

/** Resolve a genre name/alias to its entry, or undefined if not recognized. */
export function lookupGenre(nameOrAlias: string): GenreTaxonomyEntry | undefined {
  const key = nameOrAlias.toLowerCase().trim();
  const id = FULL_GENRE_ALIAS_MAP.get(key);
  if (!id) return undefined;
  return ALL_GENRES.find((g) => g.id === id);
}

export const fallbackGenreEntry = ALL_GENRES.find((g) => g.id === 'g:unknown')!;
