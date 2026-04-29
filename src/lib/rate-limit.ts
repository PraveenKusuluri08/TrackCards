type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitState = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, RateLimitState>();

function nowMs() {
  return Date.now();
}

function cleanupOccasionally() {
  // Cheap-ish periodic cleanup; avoids unbounded growth in long dev sessions.
  if (buckets.size < 5000) return;
  const t = nowMs();
  for (const [k, v] of buckets) {
    if (v.resetAt <= t) buckets.delete(k);
  }
}

export function getClientIp(request: Request): string {
  const h = request.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function rateLimit(key: string, opts: RateLimitOptions): { ok: boolean; remaining: number; resetAt: number } {
  cleanupOccasionally();
  const t = nowMs();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= t) {
    const resetAt = t + opts.windowMs;
    buckets.set(key, { resetAt, count: 1 });
    return { ok: true, remaining: Math.max(0, opts.max - 1), resetAt };
  }

  if (existing.count >= opts.max) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { ok: true, remaining: Math.max(0, opts.max - existing.count), resetAt: existing.resetAt };
}

