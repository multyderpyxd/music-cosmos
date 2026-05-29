import { genreId } from '@music-cosmos/domain';
import type { Genre } from '@music-cosmos/domain';

export const GENRE_ELECTRONIC: Genre = {
  id: genreId('g:electronic'),
  name: 'Electronic',
  aliases: ['electronica', 'edm'],
  externalIds: {},
};

export const GENRE_ROCK: Genre = {
  id: genreId('g:rock'),
  name: 'Rock',
  aliases: [],
  externalIds: {},
};

export const GENRE_HIP_HOP: Genre = {
  id: genreId('g:hip-hop'),
  name: 'Hip-Hop',
  aliases: ['rap'],
  externalIds: {},
};

export const allGenreFixtures: Genre[] = [GENRE_ELECTRONIC, GENRE_ROCK, GENRE_HIP_HOP];
