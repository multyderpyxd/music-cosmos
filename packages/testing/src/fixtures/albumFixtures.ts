import { albumId, artistId, genreId, trackId } from '@music-cosmos/domain';
import type { Album } from '@music-cosmos/domain';

export const ALBUM_UNTRUE: Album = {
  id: albumId('al:burial-untrue'),
  title: 'Untrue',
  artistId: artistId('a:burial'),
  type: 'album',
  releaseYear: 2007,
  genreIds: [genreId('g:electronic')],
  trackIds: [trackId('t:archangel'), trackId('t:shell-of-light'), trackId('t:ghost-hardware')],
  externalIds: { spotifyId: '3IcMdQQHLiBCKn9jxZf6gT' },
  isUnknown: false,
};

export const ALBUM_BURIAL_SELF_TITLED: Album = {
  id: albumId('al:burial-st'),
  title: 'Burial',
  artistId: artistId('a:burial'),
  type: 'album',
  releaseYear: 2006,
  genreIds: [genreId('g:electronic')],
  trackIds: [trackId('t:near-dark'), trackId('t:south-london')],
  externalIds: {},
  isUnknown: false,
};

export const ALBUM_OK_COMPUTER: Album = {
  id: albumId('al:radiohead-okc'),
  title: 'OK Computer',
  artistId: artistId('a:radiohead'),
  type: 'album',
  releaseYear: 1997,
  genreIds: [genreId('g:rock')],
  trackIds: [trackId('t:paranoid-android'), trackId('t:karma-police'), trackId('t:no-surprises')],
  externalIds: { spotifyId: '6dVIqQ8qmQ5GBnJ9shOYGE' },
  isUnknown: false,
};

export const ALBUM_KID_A: Album = {
  id: albumId('al:radiohead-kida'),
  title: 'Kid A',
  artistId: artistId('a:radiohead'),
  type: 'album',
  releaseYear: 2000,
  genreIds: [genreId('g:rock'), genreId('g:electronic')],
  trackIds: [trackId('t:everything-in-its-right-place'), trackId('t:how-to-disappear')],
  externalIds: {},
  isUnknown: false,
};

export const ALBUM_TPAB: Album = {
  id: albumId('al:kendrick-tpab'),
  title: "To Pimp a Butterfly",
  artistId: artistId('a:kendrick-lamar'),
  type: 'album',
  releaseYear: 2015,
  genreIds: [genreId('g:hip-hop')],
  trackIds: [trackId('t:alright'), trackId('t:king-kunta'), trackId('t:the-blacker-the-berry')],
  externalIds: { spotifyId: '7ycBtnsMtyVbbwTfJwRjSP' },
  isUnknown: false,
};

export const allAlbumFixtures: Album[] = [
  ALBUM_UNTRUE,
  ALBUM_BURIAL_SELF_TITLED,
  ALBUM_OK_COMPUTER,
  ALBUM_KID_A,
  ALBUM_TPAB,
];
