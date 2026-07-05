import "server-only";

// Limitador en memoria: suficiente para MVP. En Vercel es por instancia
// (se resetea en cold start); si el producto crece, sustituir por KV/Upstash.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
}
