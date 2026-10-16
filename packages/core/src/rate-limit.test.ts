import { describe, expect, it } from 'vitest';
import { MemoryRateLimiter } from './rate-limit';

describe('memory rate limit', () => {
  it('blocks over the limit and resets after the window', () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.consume('buyer', 2, 1000, 100)).toBe(true);
    expect(limiter.consume('buyer', 2, 1000, 101)).toBe(true);
    expect(limiter.consume('buyer', 2, 1000, 102)).toBe(false);
    expect(limiter.consume('buyer', 2, 1000, 1100)).toBe(true);
    expect(limiter.consume('other', 2, 1000, 102)).toBe(true);
  });
});
