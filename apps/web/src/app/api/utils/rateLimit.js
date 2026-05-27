import { tooMany } from "./response";

const buckets = new Map();
const CLEANUP_INTERVAL = 60000;

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    bucket.items = bucket.items.filter((t) => now - t < bucket.windowMs);
    if (bucket.items.length === 0) buckets.delete(key);
  }
}, CLEANUP_INTERVAL).unref();

export function rateLimit({ windowMs = 60000, max = 60, keyFn } = {}) {
  return (request) => {
    const key = keyFn
      ? keyFn(request)
      : request.headers.get("x-forwarded-for") ||
        request.headers.get("cf-connecting-ip") ||
        "anonymous";
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { items: [], windowMs };
      buckets.set(key, bucket);
    }

    bucket.items = bucket.items.filter((t) => now - t < windowMs);

    if (bucket.items.length >= max) {
      const retryAfter = Math.ceil(
        (bucket.items[0] + windowMs - now) / 1000,
      );
      return tooMany(`Rate limited. Retry after ${retryAfter}s`);
    }

    bucket.items.push(now);
    return null;
  };
}
