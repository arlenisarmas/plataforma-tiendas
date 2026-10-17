import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readStorefront, variantSchema } from '../../../lib/storefront-data';

const querySchema = z.object({ storeId: z.uuid(), productId: z.uuid() });

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { storeId, productId } = parsed.data;
  const variants = await readStorefront('variants', variantSchema,
    { store_id: `eq.${storeId}`, product_id: `eq.${productId}` }, [], true);
  return NextResponse.json(variants.map(({ id, is_available }) => ({ id, is_available })),
    { headers: { 'Cache-Control': 'no-store' } });
}
