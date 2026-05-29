import { artistId, genreId } from '@music-cosmos/domain';
import type { Artist } from '@music-cosmos/domain';

export const ARTIST_BURIAL: Artist = {
  id: artistId('a:burial'),
  name: 'Burial',
  normalizedName: 'burial',
  primaryGenreId: genreId('g:electronic'),
  genreIds: [genreId('g:electronic')],
  aliases: [],
  externalIds: { spotifyId: '3sHQhNFPdSN4mLKOsJhAGJ' },
  isUnknown: false,
};

export const ARTIST_APHEX_TWIN: Artist = {
  id: artistId('a:aphex-twin'),
  name: 'Aphex Twin',
  normalizedName: 'aphex twin',
  primaryGenreId: genreId('g:electronic'),
  genreIds: [genreId('g:electronic')],
  aliases: ['AFX', 'The Aphex Twin'],
  externalIds: { spotifyId: '6kBDZFXuLrZgHnvmPu9NsG' },
  isUnknown: false,
};

export const ARTIST_RADIOHEAD: Artist = {
  id: artistId('a:radiohead'),
  name: 'Radiohead',
  normalizedName: 'radiohead',
  primaryGenreId: genreId('g:rock'),
  genreIds: [genreId('g:rock'), genreId('g:electronic')],
  aliases: [],
  externalIds: { spotifyId: '4Z8W4fKeB5YxbusRsdQVPb' },
  isUnknown: false,
};

export const ARTIST_KENDRICK: Artist = {
  id: artistId('a:kendrick-lamar'),
  name: 'Kendrick Lamar',
  normalizedName: 'kendrick lamar',
  primaryGenreId: genreId('g:hip-hop'),
  genreIds: [genreId('g:hip-hop')],
  aliases: ['K.Dot'],
  externalIds: { spotifyId: '2YZyLoL8N0Wb9xBt1NhZWg' },
  isUnknown: false,
};

export const ARTIST_FOUR_TET: Artist = {
  id: artistId('a:four-tet'),
  name: 'Four Tet',
  normalizedName: 'four tet',
  primaryGenreId: genreId('g:electronic'),
  genreIds: [genreId('g:electronic')],
  aliases: ['Kieran Hebden'],
  externalIds: { spotifyId: '7Eu1txygG6nJttLHbZdQOh' },
  isUnknown: false,
};

export const ARTIST_RADIOHEAD_CLONE: Artist = {
  id: artistId('a:radiohead'),
  name: 'RADIOHEAD',
  normalizedName: 'radiohead',
  primaryGenreId: genreId('g:rock'),
  genreIds: [genreId('g:rock')],
  aliases: [],
  externalIds: {},
  isUnknown: false,
};

export const allArtistFixtures: Artist[] = [
  ARTIST_BURIAL,
  ARTIST_APHEX_TWIN,
  ARTIST_RADIOHEAD,
  ARTIST_KENDRICK,
  ARTIST_FOUR_TET,
];
