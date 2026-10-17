export interface RateLimiter { consume(key: string, limit: number, windowMs: number, now?: number): boolean }

export class MemoryRateLimiter implements RateLimiter {
  private readonly entries = new Map<string, { count: number; resetAt: number }>();

  consume(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
    if (this.entries.size > 5000) for (const [id, value] of this.entries)
      if (value.resetAt <= now) this.entries.delete(id);
    const current = this.entries.get(key);
    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (current.count >= limit) return false;
    current.count++;
    return true;
  }
}
