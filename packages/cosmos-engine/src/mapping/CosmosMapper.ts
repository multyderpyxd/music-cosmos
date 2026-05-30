import type { MusicDataset, ListeningStats } from '@music-cosmos/domain';
import type { VisualRules, RenderBudget, ViewMode } from '@music-cosmos/config';
import type { CosmicGraph, CosmicNode, CosmicEdge } from '../types/CosmicTypes.js';

function enforceHierarchy(nodes: Map<string, CosmicNode>): void {
  // Planets must be smaller than their parent star
  for (const node of nodes.values()) {
    if ((node.entityType === 'planet' || node.entityType === 'satellite') && node.parentId) {
      const parent = nodes.get(node.parentId);
      if (parent) {
        const maxSize = parent.visualProps.size * 0.7;
        if (node.visualProps.size > maxSize) node.visualProps.size = maxSize;
      }
    }
  }
}
import { makeGalaxyProps, makeStarProps, makePlanetProps, makeSatelliteProps } from './visualPropsFactory.js';
import type { StatRange } from './visualPropsFactory.js';

function computeRange(
  ids: Iterable<string>,
  stats: Map<string, ListeningStats>,
  metric: 'totalPlays' | 'totalMinutes',
): StatRange {
  let min = Infinity;
  let max = -Infinity;
  for (const id of ids) {
    const s = stats.get(id);
    if (!s) continue;
    const v = metric === 'totalPlays' ? s.totalPlays : s.totalMinutes;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max };
}

export function mapDatasetToCosmicGraph(
  dataset: MusicDataset,
  stats: Map<string, ListeningStats>,
  rules: VisualRules,
  budget: RenderBudget,
  viewMode: ViewMode,
): CosmicGraph {
  const nodes = new Map<string, CosmicNode>();
  const edges: CosmicEdge[] = [];
  const rootIds: string[] = [];
  const now = new Date();

  const genreRange = computeRange(
    [...dataset.genres.keys()].map(String),
    stats,
    rules.galaxy.sizeMetric,
  );

  let galaxyColorIdx = 0;
  for (const [gId, genre] of dataset.genres) {
    const gStats = stats.get(String(gId));
    if (!gStats) continue;

    const galaxyNodeId = `galaxy:${String(gId)}`;
    const galaxyNode: CosmicNode = {
      id: galaxyNodeId,
      entityType: 'galaxy',
      domainId: String(gId),
      visualProps: makeGalaxyProps(gStats, genreRange, rules, galaxyColorIdx++),
      label: genre.name,
      metadata: { genreId: String(gId) },
    };
    nodes.set(galaxyNodeId, galaxyNode);
    rootIds.push(galaxyNodeId);

    const artistsInGenre = [...dataset.artists.values()].filter(
      (a) => a.primaryGenreId === gId,
    );

    const artistBudget =
      viewMode === 'universe'
        ? budget.universe.maxArtistsPerGalaxy
        : viewMode === 'galaxy'
          ? budget.galaxy.maxArtists
          : artistsInGenre.length;

    const sortedArtists = artistsInGenre
      .map((a) => ({ artist: a, plays: stats.get(String(a.id))?.totalPlays ?? 0 }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, artistBudget);

    const artistRange = computeRange(
      sortedArtists.map((a) => String(a.artist.id)),
      stats,
      rules.star.sizeMetric,
    );

    let starColorIdx = 0;
    for (const { artist } of sortedArtists) {
      const aStats = stats.get(String(artist.id));
      if (!aStats) continue;

      const starNodeId = `star:${String(artist.id)}`;
      const starNode: CosmicNode = {
        id: starNodeId,
        entityType: 'star',
        domainId: String(artist.id),
        parentId: galaxyNodeId,
        visualProps: makeStarProps(aStats, artistRange, rules, starColorIdx++, now),
        label: artist.name,
        metadata: { artistId: String(artist.id) },
      };
      nodes.set(starNodeId, starNode);

      if (viewMode === 'universe' && !budget.universe.showAlbums) continue;
      if (viewMode === 'galaxy' && !budget.galaxy.showTracks) {
        const previewCount = budget.galaxy.maxPreviewAlbumsPerArtist;
        addAlbumsForArtist(artist.id, starNodeId, previewCount);
        continue;
      }

      const albumBudget =
        viewMode === 'artist' || viewMode === 'album'
          ? budget.artist.maxAlbums
          : budget.galaxy.maxPreviewAlbumsPerArtist;
      addAlbumsForArtist(artist.id, starNodeId, albumBudget);
    }

    function addAlbumsForArtist(
      aId: typeof artistsInGenre[0]['id'],
      starNodeId: string,
      maxAlbums: number,
    ): void {
      const artistAlbums = [...dataset.albums.values()]
        .filter((al) => al.artistId === aId)
        .map((al) => ({ album: al, plays: stats.get(String(al.id))?.totalPlays ?? 0 }))
        .sort((a, b) => b.plays - a.plays)
        .slice(0, maxAlbums);

      const albumRange = computeRange(
        artistAlbums.map((a) => String(a.album.id)),
        stats,
        rules.planet.sizeMetric,
      );

      for (const { album } of artistAlbums) {
        const alStats = stats.get(String(album.id));
        if (!alStats) continue;

        const planetNodeId = `planet:${String(album.id)}`;
        const planetNode: CosmicNode = {
          id: planetNodeId,
          entityType: 'planet',
          domainId: String(album.id),
          parentId: starNodeId,
          visualProps: makePlanetProps(alStats, albumRange, rules, album.releaseYear, now),
          label: album.title,
          metadata: { albumId: String(album.id), albumType: album.type, albumTitle: album.title },
        };
        nodes.set(planetNodeId, planetNode);

        if (viewMode !== 'artist' && viewMode !== 'album') continue;

        const maxTracks =
          viewMode === 'album' ? budget.album.maxTracks : budget.artist.maxTracksPerAlbum;

        const albumTracks = album.trackIds
          .map((tId) => ({ track: dataset.tracks.get(tId), tId }))
          .filter((t) => t.track !== undefined)
          .map(({ track, tId }) => ({
            track: track!,
            plays: stats.get(String(tId))?.totalPlays ?? 0,
          }))
          .sort((a, b) => b.plays - a.plays);

        const visibleTracks = albumTracks.slice(0, maxTracks);
        const hiddenCount = albumTracks.length - visibleTracks.length;

        const trackRange = computeRange(
          visibleTracks.map((t) => String(t.track.id)),
          stats,
          rules.satellite.sizeMetric,
        );

        for (const { track } of visibleTracks) {
          const tStats = stats.get(String(track.id));
          if (!tStats) continue;

          const satNodeId = `satellite:${String(track.id)}`;
          nodes.set(satNodeId, {
            id: satNodeId,
            entityType: 'satellite',
            domainId: String(track.id),
            parentId: planetNodeId,
            visualProps: makeSatelliteProps(tStats, trackRange, alStats, rules, now),
            label: track.title,
            metadata: { trackId: String(track.id) },
          });
        }

        if (hiddenCount > 0) {
          const beltNodeId = `asteroid-belt:${String(album.id)}`;
          nodes.set(beltNodeId, {
            id: beltNodeId,
            entityType: 'asteroid-belt',
            domainId: String(album.id),
            parentId: planetNodeId,
            visualProps: { size: 0.3, brightness: 0.4, color: [0.7, 0.7, 0.6], mass: 0.1 },
            label: `+${hiddenCount} tracks`,
            metadata: { hiddenCount, albumId: String(album.id) },
          });
        }
      }
    }
  }

  for (const [, artist] of dataset.artists) {
    if (artist.genreIds.length > 1) {
      const primaryStarId = `star:${String(artist.id)}`;
      if (!nodes.has(primaryStarId)) continue;
      for (const gId of artist.genreIds) {
        if (gId === artist.primaryGenreId) continue;
        const galaxyNodeId = `galaxy:${String(gId)}`;
        if (!nodes.has(galaxyNodeId)) continue;
        edges.push({
          id: `bridge:${String(artist.id)}-${String(gId)}`,
          sourceId: primaryStarId,
          targetId: galaxyNodeId,
          type: 'gravitational-bridge',
          weight: 0.3,
        });
      }
    }
  }

  enforceHierarchy(nodes);

  return { nodes, edges, rootIds };
}
