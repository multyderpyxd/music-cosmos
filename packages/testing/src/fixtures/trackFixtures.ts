import { trackId, artistId, albumId, genreId } from '@music-cosmos/domain';
import type { Track } from '@music-cosmos/domain';

export const TRACK_ARCHANGEL: Track = {
  id: trackId('t:archangel'),
  title: 'Archangel',
  artistId: artistId('a:burial'),
  albumId: albumId('al:burial-untrue'),
  durationMs: 215_000,
  genreIds: [genreId('g:electronic')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_SHELL_OF_LIGHT: Track = {
  id: trackId('t:shell-of-light'),
  title: 'Shell of Light',
  artistId: artistId('a:burial'),
  albumId: albumId('al:burial-untrue'),
  durationMs: 349_000,
  genreIds: [genreId('g:electronic')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_GHOST_HARDWARE: Track = {
  id: trackId('t:ghost-hardware'),
  title: 'Ghost Hardware',
  artistId: artistId('a:burial'),
  albumId: albumId('al:burial-untrue'),
  durationMs: 289_000,
  genreIds: [genreId('g:electronic')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_NEAR_DARK: Track = {
  id: trackId('t:near-dark'),
  title: 'Near Dark',
  artistId: artistId('a:burial'),
  albumId: albumId('al:burial-st'),
  durationMs: 301_000,
  genreIds: [genreId('g:electronic')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_SOUTH_LONDON: Track = {
  id: trackId('t:south-london'),
  title: 'South London Boroughs',
  artistId: artistId('a:burial'),
  albumId: albumId('al:burial-st'),
  durationMs: 178_000,
  genreIds: [genreId('g:electronic')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_PARANOID_ANDROID: Track = {
  id: trackId('t:paranoid-android'),
  title: 'Paranoid Android',
  artistId: artistId('a:radiohead'),
  albumId: albumId('al:radiohead-okc'),
  durationMs: 383_000,
  genreIds: [genreId('g:rock')],
  externalIds: { spotifyId: '6LgJvl0Xdtc73RJ1mmpgqDf' },
  isUnknown: false,
};

export const TRACK_KARMA_POLICE: Track = {
  id: trackId('t:karma-police'),
  title: 'Karma Police',
  artistId: artistId('a:radiohead'),
  albumId: albumId('al:radiohead-okc'),
  durationMs: 263_000,
  genreIds: [genreId('g:rock')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_NO_SURPRISES: Track = {
  id: trackId('t:no-surprises'),
  title: 'No Surprises',
  artistId: artistId('a:radiohead'),
  albumId: albumId('al:radiohead-okc'),
  durationMs: 228_000,
  genreIds: [genreId('g:rock')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_EVERYTHING: Track = {
  id: trackId('t:everything-in-its-right-place'),
  title: 'Everything in Its Right Place',
  artistId: artistId('a:radiohead'),
  albumId: albumId('al:radiohead-kida'),
  durationMs: 259_000,
  genreIds: [genreId('g:rock'), genreId('g:electronic')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_HOW_TO_DISAPPEAR: Track = {
  id: trackId('t:how-to-disappear'),
  title: 'How to Disappear Completely',
  artistId: artistId('a:radiohead'),
  albumId: albumId('al:radiohead-kida'),
  durationMs: 355_000,
  genreIds: [genreId('g:rock')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_ALRIGHT: Track = {
  id: trackId('t:alright'),
  title: 'Alright',
  artistId: artistId('a:kendrick-lamar'),
  albumId: albumId('al:kendrick-tpab'),
  durationMs: 219_000,
  genreIds: [genreId('g:hip-hop')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_KING_KUNTA: Track = {
  id: trackId('t:king-kunta'),
  title: 'King Kunta',
  artistId: artistId('a:kendrick-lamar'),
  albumId: albumId('al:kendrick-tpab'),
  durationMs: 234_000,
  genreIds: [genreId('g:hip-hop')],
  externalIds: {},
  isUnknown: false,
};

export const TRACK_BLACKER_THE_BERRY: Track = {
  id: trackId('t:the-blacker-the-berry'),
  title: 'The Blacker the Berry',
  artistId: artistId('a:kendrick-lamar'),
  albumId: albumId('al:kendrick-tpab'),
  durationMs: 337_000,
  genreIds: [genreId('g:hip-hop')],
  externalIds: {},
  isUnknown: false,
};

export const allTrackFixtures: Track[] = [
  TRACK_ARCHANGEL, TRACK_SHELL_OF_LIGHT, TRACK_GHOST_HARDWARE,
  TRACK_NEAR_DARK, TRACK_SOUTH_LONDON,
  TRACK_PARANOID_ANDROID, TRACK_KARMA_POLICE, TRACK_NO_SURPRISES,
  TRACK_EVERYTHING, TRACK_HOW_TO_DISAPPEAR,
  TRACK_ALRIGHT, TRACK_KING_KUNTA, TRACK_BLACKER_THE_BERRY,
];
