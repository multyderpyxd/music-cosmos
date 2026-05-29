export type GenreId = string & { readonly __brand: 'GenreId' };
export type ArtistId = string & { readonly __brand: 'ArtistId' };
export type AlbumId = string & { readonly __brand: 'AlbumId' };
export type TrackId = string & { readonly __brand: 'TrackId' };
export type PlaylistId = string & { readonly __brand: 'PlaylistId' };

export const genreId = (s: string): GenreId => s as GenreId;
export const artistId = (s: string): ArtistId => s as ArtistId;
export const albumId = (s: string): AlbumId => s as AlbumId;
export const trackId = (s: string): TrackId => s as TrackId;
export const playlistId = (s: string): PlaylistId => s as PlaylistId;
