export function linearScale(
  value: number,
  min: number,
  max: number,
  outMin: number,
  outMax: number,
): number {
  if (max <= min) return outMin;
  const clamped = Math.max(min, Math.min(max, value));
  return outMin + ((clamped - min) / (max - min)) * (outMax - outMin);
}

export function logScale(
  value: number,
  min: number,
  max: number,
  outMin: number,
  outMax: number,
): number {
  if (max <= min) return outMin;
  const logMin = Math.log1p(Math.max(0, min));
  const logMax = Math.log1p(Math.max(0, max));
  if (logMax <= logMin) return outMin;
  const clamped = Math.max(min, Math.min(max, value));
  const logVal = Math.log1p(Math.max(0, clamped));
  return outMin + ((logVal - logMin) / (logMax - logMin)) * (outMax - outMin);
}

export function sqrtScale(
  value: number,
  min: number,
  max: number,
  outMin: number,
  outMax: number,
): number {
  if (max <= min) return outMin;
  const sqrtMin = Math.sqrt(Math.max(0, min));
  const sqrtMax = Math.sqrt(Math.max(0, max));
  if (sqrtMax <= sqrtMin) return outMin;
  const clamped = Math.max(min, Math.min(max, value));
  const sqrtVal = Math.sqrt(Math.max(0, clamped));
  return outMin + ((sqrtVal - sqrtMin) / (sqrtMax - sqrtMin)) * (outMax - outMin);
}

export function recencyDecay(lastPlayedAt: Date, now: Date, halfLifeDays: number): number {
  const daysSince = (now.getTime() - lastPlayedAt.getTime()) / 86_400_000;
  return Math.pow(0.5, daysSince / Math.max(1, halfLifeDays));
}

export function scaleByMethod(
  method: 'log' | 'sqrt' | 'linear',
  value: number,
  min: number,
  max: number,
  outMin: number,
  outMax: number,
): number {
  switch (method) {
    case 'log':
      return logScale(value, min, max, outMin, outMax);
    case 'sqrt':
      return sqrtScale(value, min, max, outMin, outMax);
    case 'linear':
      return linearScale(value, min, max, outMin, outMax);
  }
}
