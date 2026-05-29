import { describe, it, expect } from 'vitest';
import { linearScale, logScale, sqrtScale, recencyDecay, scaleByMethod } from './scalers.js';

describe('linearScale', () => {
  it('maps min to outMin', () => expect(linearScale(0, 0, 100, 0, 1)).toBe(0));
  it('maps max to outMax', () => expect(linearScale(100, 0, 100, 0, 1)).toBe(1));
  it('maps midpoint correctly', () => expect(linearScale(50, 0, 100, 0, 1)).toBeCloseTo(0.5));
  it('clamps below min', () => expect(linearScale(-10, 0, 100, 0, 1)).toBe(0));
  it('clamps above max', () => expect(linearScale(200, 0, 100, 0, 1)).toBe(1));
  it('returns outMin when min === max', () => expect(linearScale(50, 50, 50, 0, 1)).toBe(0));
});

describe('logScale', () => {
  it('maps min to outMin', () => expect(logScale(0, 0, 100, 0, 1)).toBeCloseTo(0));
  it('maps max to outMax', () => expect(logScale(100, 0, 100, 0, 1)).toBeCloseTo(1));
  it('is monotone increasing', () => {
    const a = logScale(10, 0, 100, 0, 1);
    const b = logScale(50, 0, 100, 0, 1);
    const c = logScale(90, 0, 100, 0, 1);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });
  it('compresses high values (midpoint < 0.5)', () => {
    const mid = logScale(50, 0, 100, 0, 1);
    expect(mid).toBeGreaterThan(0.5);
  });
  it('clamps below min', () => expect(logScale(-5, 0, 100, 0, 1)).toBeCloseTo(0));
  it('returns outMin when min === max', () => expect(logScale(50, 50, 50, 0, 1)).toBe(0));
});

describe('sqrtScale', () => {
  it('maps min to outMin', () => expect(sqrtScale(0, 0, 100, 0, 1)).toBeCloseTo(0));
  it('maps max to outMax', () => expect(sqrtScale(100, 0, 100, 0, 1)).toBeCloseTo(1));
  it('is monotone increasing', () => {
    expect(sqrtScale(25, 0, 100, 0, 1)).toBeLessThan(sqrtScale(75, 0, 100, 0, 1));
  });
});

describe('recencyDecay', () => {
  const now = new Date('2025-01-01T00:00:00Z');

  it('returns 1 when played right now', () => {
    expect(recencyDecay(now, now, 30)).toBeCloseTo(1);
  });
  it('returns 0.5 after one half-life', () => {
    const past = new Date(now.getTime() - 30 * 86_400_000);
    expect(recencyDecay(past, now, 30)).toBeCloseTo(0.5);
  });
  it('returns 0.25 after two half-lives', () => {
    const past = new Date(now.getTime() - 60 * 86_400_000);
    expect(recencyDecay(past, now, 30)).toBeCloseTo(0.25);
  });
  it('decays toward 0 for very old plays', () => {
    const past = new Date(now.getTime() - 3650 * 86_400_000);
    expect(recencyDecay(past, now, 30)).toBeLessThan(0.001);
  });
});

describe('scaleByMethod', () => {
  it('delegates to log', () => expect(scaleByMethod('log', 100, 0, 100, 0, 1)).toBeCloseTo(1));
  it('delegates to sqrt', () => expect(scaleByMethod('sqrt', 100, 0, 100, 0, 1)).toBeCloseTo(1));
  it('delegates to linear', () => expect(scaleByMethod('linear', 100, 0, 100, 0, 1)).toBe(1));
});
