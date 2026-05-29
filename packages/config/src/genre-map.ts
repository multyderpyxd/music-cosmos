export interface GenreDefinition {
  id: string;
  name: string;
  parentId?: string;
  aliases: string[];
  color?: string;
}

export const genreDefinitions: readonly GenreDefinition[] = [
  { id: 'g:electronic', name: 'Electronic', aliases: ['electronica', 'edm'] },
  { id: 'g:house', name: 'House', parentId: 'g:electronic', aliases: ['deep house', 'tech house'] },
  { id: 'g:techno', name: 'Techno', parentId: 'g:electronic', aliases: [] },
  { id: 'g:ambient', name: 'Ambient', parentId: 'g:electronic', aliases: ['drone'] },
  { id: 'g:rock', name: 'Rock', aliases: [] },
  { id: 'g:indie-rock', name: 'Indie Rock', parentId: 'g:rock', aliases: ['indie'] },
  { id: 'g:post-rock', name: 'Post-Rock', parentId: 'g:rock', aliases: [] },
  { id: 'g:hip-hop', name: 'Hip-Hop', aliases: ['rap', 'hip hop'] },
  { id: 'g:jazz', name: 'Jazz', aliases: [] },
  { id: 'g:classical', name: 'Classical', aliases: ['orchestral', 'contemporary classical'] },
  { id: 'g:pop', name: 'Pop', aliases: [] },
  { id: 'g:folk', name: 'Folk', aliases: ['singer-songwriter', 'acoustic'] },
  { id: 'g:metal', name: 'Metal', aliases: ['heavy metal', 'doom'] },
  { id: 'g:rnb', name: 'R&B', aliases: ['soul', 'r&b', 'rnb'] },
  { id: 'g:unknown', name: 'Unknown', aliases: [] },
];

export const genreAliasMap: Map<string, string> = new Map(
  genreDefinitions.flatMap((g) =>
    [g.name.toLowerCase(), ...g.aliases.map((a) => a.toLowerCase())].map((alias) => [
      alias,
      g.id,
    ]),
  ),
);

export const fallbackGenreId = 'g:unknown';
