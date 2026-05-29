# Visual Language

## Core Metaphor

| Musical concept | Cosmic representation |
|----------------|-----------------------|
| Genre | Galaxy |
| Artist | Star |
| Album | Planet |
| Track | Satellite / Moon |
| Unrendered tracks | Asteroid belt |
| Playlist (future) | Constellation |
| Artist collaboration (future) | Gravitational bridge |
| Listening peak (future) | Supernova |

## Visual Encoding

### Size
Encodes personal relevance — how much you've listened to this entity.
- Galaxy size = total minutes listened to the genre
- Star size = total plays for the artist
- Planet size = total plays for the album
- Satellite size = total plays for the track

Scaling is logarithmic by default to prevent one entity from dwarfing everything else.

### Brightness
Encodes recency — how recently you've listened.
- Stars: brightness decays with a 30-day half-life
- Satellites: brightness decays with a 14-day half-life

### Distance (Orbital Radius)
- Planet distance from star = album release age (older albums orbit farther)
- Satellite distance from planet = inverse personal affinity (most-listened tracks orbit closest)

### Orbital Speed
- Planet speed = recent play frequency (albums you play often orbit faster)
- Satellite speed = personal affinity relative to album

### Color
- Galaxies: color from the `nebula` palette (distinct per genre)
- Stars: color from the `stellar` palette (temperature-like: cooler = more played recently)

## Configuration

All visual rules live in `packages/config/src/visual-rules.ts`. They are never hardcoded in React components.

## Future Entities

- **Comets**: Artists or tracks with intense short-term listening bursts
- **Supernovas**: Historical listening peaks / exceptional months
- **Nebulae**: Mood clusters, language groups, or listening eras
- **Constellations**: Playlists (connect stars with visible lines)
- **Gravitational bridges**: Visualized when artists span multiple genre galaxies
