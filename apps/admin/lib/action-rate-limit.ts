import { headers } from 'next/headers';
import { MemoryRateLimiter } from '@plataforma/core';

const limiter = new MemoryRateLimiter();

export async function allowAction(kind: string, limit: number, windowMs: number): Promise<boolean> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  return limiter.consume(`${kind}:${ip}`, limit, windowMs);
}
