/** Reads a numeric simulator param, falling back when missing or out of range. */
export function numberParam(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function asRecord(params: unknown): Record<string, unknown> {
  return params !== null && typeof params === 'object' ? (params as Record<string, unknown>) : {};
}
