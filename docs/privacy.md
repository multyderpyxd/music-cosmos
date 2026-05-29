# Privacy

## Your data stays in your browser

Music Cosmos processes your listening history **entirely in your browser**. Nothing is ever uploaded to a server.

### What happens when you import a file

1. You select or drag a file from your device.
2. The file is read directly by the browser's `File API`.
3. The JSON is parsed and processed in JavaScript on your machine.
4. The resulting visualisation lives in memory only for the current browser tab.
5. When you close or refresh the tab, all data is gone.

### What is never transmitted

- Your listening history
- Track names, artist names, or album titles
- Any derived statistics
- Your file contents

### Local storage

Music Cosmos does **not** write to `localStorage`, `IndexedDB`, cookies, or any other persistent browser storage. Every session starts fresh.

### Third-party services

Music Cosmos makes **no network requests** at runtime. It does not contact Spotify, stats.fm, or any analytics service while in use.

The app is a static web application served from GitHub Pages / GitHub Codespaces. The only network activity is the initial page load.

### Supported import formats

| Source | Format | Privacy |
|--------|--------|---------|
| [stats.fm](https://stats.fm) | JSON export from settings | Local only |
| Spotify Extended History | JSON files from Spotify privacy request | Local only |

### How to export from each source

**stats.fm:**
1. Go to [stats.fm](https://stats.fm) → Settings → Export data
2. Click "Export" and download the JSON file
3. Drag it into Music Cosmos

**Spotify Extended Streaming History:**
1. Go to [spotify.com](https://spotify.com) → Account → Privacy settings
2. Click "Request data" → select "Extended streaming history"
3. You will receive an email (up to 30 days) with a download link
4. Unzip and drag any of the `.json` files into Music Cosmos

### Questions

This is an open-source personal project. Source code is available at [github.com/multyderpyxd/music-cosmos](https://github.com/multyderpyxd/music-cosmos).
