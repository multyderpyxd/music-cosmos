import * as THREE from 'three';

// ── Deterministic hash (integer arithmetic, no floating-point accumulation) ──

function hash(x: number, y: number, seed: number): number {
  let h = (seed | 0) + Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothstep(t: number): number { return t * t * (3 - 2 * t); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

// Value noise: smooth interpolation between corner hashes
function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smoothstep(x - ix), fy = smoothstep(y - iy);
  const aa = hash(ix,     iy,     seed);
  const ba = hash(ix + 1, iy,     seed);
  const ab = hash(ix,     iy + 1, seed);
  const bb = hash(ix + 1, iy + 1, seed);
  return lerp(lerp(aa, ba, fx), lerp(ab, bb, fx), fy);
}

// Fractal Brownian Motion — layered noise octaves
function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let value = 0, amplitude = 0.5, frequency = 1, total = 0;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * frequency, y * frequency, seed + i * 1031) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value / total;
}

// ── Color palette generation when no album art is available ──────────────────

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

/** Compute 3 palette colors from a base planet color using hue rotation. */
export function computeFallbackPalette(
  baseColor: readonly [number, number, number],
  seed: number,
): [number, number, number][] {
  const [h, s, l] = rgbToHsl(baseColor[0], baseColor[1], baseColor[2]);
  const shift = 25 + (seed % 30);          // 25–55° hue shift
  const lightShift = 0.12;
  return [
    hslToRgb(h, s * 1.1, Math.max(0.08, l - lightShift)),
    hslToRgb((h + shift) % 360, s, l),
    hslToRgb((h + shift * 2) % 360, s * 0.8, Math.min(0.95, l + lightShift)),
  ];
}

// ── Color extraction from album image URL ────────────────────────────────────

const colorCache = new Map<string, [number, number, number][]>();

function kMeansColors(data: Uint8ClampedArray, k: number): [number, number, number][] {
  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 16) {      // sample every 4th pixel
    if ((data[i + 3] ?? 0) < 128) continue;          // skip transparent
    pixels.push([(data[i]! / 255), (data[i + 1]! / 255), (data[i + 2]! / 255)]);
  }
  if (pixels.length < k) return [[0.35, 0.5, 0.8]];

  // Initialize centroids spread across brightness range
  pixels.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
  let centroids: [number, number, number][] = Array.from({ length: k }, (_, i) =>
    [...(pixels[Math.floor(i * (pixels.length - 1) / Math.max(1, k - 1))] ?? pixels[0]!)] as [number, number, number],
  );

  for (let iter = 0; iter < 10; iter++) {
    const buckets: [number, number, number][][] = Array.from({ length: k }, () => []);
    for (const p of pixels) {
      let nearest = 0, minD = Infinity;
      for (let c = 0; c < k; c++) {
        const cen = centroids[c]!;
        const d = (p[0] - cen[0]) ** 2 + (p[1] - cen[1]) ** 2 + (p[2] - cen[2]) ** 2;
        if (d < minD) { minD = d; nearest = c; }
      }
      buckets[nearest]!.push(p);
    }
    centroids = buckets.map((bucket, i): [number, number, number] => {
      if (bucket.length === 0) return centroids[i]!;
      return [
        bucket.reduce((s, p) => s + p[0], 0) / bucket.length,
        bucket.reduce((s, p) => s + p[1], 0) / bucket.length,
        bucket.reduce((s, p) => s + p[2], 0) / bucket.length,
      ];
    });
  }
  return centroids;
}

async function extractColors(imageUrl: string): Promise<[number, number, number][]> {
  if (colorCache.has(imageUrl)) return colorCache.get(imageUrl)!;

  return new Promise<[number, number, number][]>((resolve) => {
    const fallback: [number, number, number][] = [[0.35, 0.5, 0.8], [0.2, 0.3, 0.55]];
    const timer = setTimeout(() => { colorCache.set(imageUrl, fallback); resolve(fallback); }, 5000);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      const SIZE = 56;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      try {
        const colors = kMeansColors(ctx.getImageData(0, 0, SIZE, SIZE).data, 3);
        colorCache.set(imageUrl, colors);
        resolve(colors);
      } catch {
        colorCache.set(imageUrl, fallback);
        resolve(fallback);
      }
    };
    img.onerror = () => { clearTimeout(timer); colorCache.set(imageUrl, fallback); resolve(fallback); };
    img.src = imageUrl;
  });
}

// ── Procedural planet texture generation ─────────────────────────────────────

const textureCache = new Map<string, THREE.Texture>();

export function generatePlanetTexture(
  colors: [number, number, number][],
  seed: number,
): THREE.Texture {
  const cacheKey = `${colors.map((c) => c.map((v) => v.toFixed(2)).join(',')).join('|')}_${seed}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(SIZE, SIZE);
  const n = Math.max(1, colors.length);

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE;
      const v = y / SIZE;

      // Domain-warp the uv with fbm for organic distortion
      const wx = fbm(u * 2.5 + seed * 0.0007, v * 2.5,       seed + 137, 3);
      const wy = fbm(u * 2.5 + seed * 0.0007, v * 2.5 + 5.2, seed + 241, 3);
      const wu = u + (wx - 0.5) * 0.22;
      const wv = v + (wy - 0.5) * 0.30;

      // Banded latitude structure (like Jupiter gas bands)
      const band = Math.sin(wv * Math.PI * 5.5 + seed * 0.3 + wu * 1.2) * 0.5 + 0.5;

      // Fine detail noise for texture
      const detail = fbm(u * 7, v * 7, seed + 400, 3) * 0.18 - 0.09;

      const t = Math.min(1, Math.max(0, band + detail));

      // Map t through the color palette
      const ct = t * (n - 1);
      const ci = Math.min(n - 2, Math.floor(ct));
      const blend = smoothstep(ct - ci);
      const c0 = colors[ci] ?? colors[n - 1]!;
      const c1 = colors[Math.min(n - 1, ci + 1)] ?? colors[n - 1]!;

      const r = lerp(c0[0], c1[0], blend);
      const g = lerp(c0[1], c1[1], blend);
      const b = lerp(c0[2], c1[2], blend);

      // Subtle brightness modulation for surface depth
      const bri = 0.82 + fbm(u * 5, v * 5, seed + 700, 2) * 0.36;

      const idx = (y * SIZE + x) * 4;
      img.data[idx]     = Math.min(255, Math.round(r * bri * 255));
      img.data[idx + 1] = Math.min(255, Math.round(g * bri * 255));
      img.data[idx + 2] = Math.min(255, Math.round(b * bri * 255));
      img.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, tex);
  return tex;
}

// ── Public API: async texture creation ────────────────────────────────────────

/** Returns a planet texture from album image colors (async) or fallback palette (sync-ish). */
export async function createPlanetTexture(
  imageUrl: string | undefined,
  fallbackColor: readonly [number, number, number],
  seed: number,
): Promise<THREE.Texture> {
  const colors = imageUrl
    ? await extractColors(imageUrl)
    : computeFallbackPalette(fallbackColor, seed);
  return generatePlanetTexture(colors, seed);
}
