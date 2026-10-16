import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  storeId: z.uuid().optional(),
  pageId: z.uuid().optional(),
  hostname: z.string().regex(/^[a-z0-9.-]{1,253}$/).optional(),
}).refine((value) => Object.values(value).some(Boolean));

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const token = request.headers.get('authorization')?.replace(/^Bearer /i, '') ?? '';
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  const actual = Buffer.from(token);
  const expected = Buffer.from(secret);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid tags' }, { status: 400 });
  const { storeId, pageId, hostname } = parsed.data;
  if (storeId) revalidateTag(`store:${storeId}`, { expire: 0 });
  if (pageId) revalidateTag(`page:${pageId}`, { expire: 0 });
  if (hostname) revalidateTag(`domain:${hostname}`, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
