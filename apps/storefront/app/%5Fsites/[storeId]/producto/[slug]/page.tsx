import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { productDetail } from '../../../../../lib/catalog';
import { catalogLabels, catalogStore } from '../../../../../lib/catalog-ui';
import { VariantPicker } from './variant-picker';

type Route = { params: Promise<{ storeId: string; slug: string }> };
const seoSchema = z.object({ title: z.string().max(140).optional(), description: z.string().max(300).optional() });

export async function generateMetadata({ params }: Route): Promise<Metadata> {
  const { storeId, slug } = await params;
  const detail = await productDetail(storeId, slug);
  if (!detail) return {};
  const seo = seoSchema.safeParse(detail.product.seo);
  const title = seo.success && seo.data.title ? seo.data.title : detail.product.name;
  const description = seo.success && seo.data.description ? seo.data.description : detail.product.description ?? undefined;
  return { title, description, openGraph: { title, description, images: detail.images[0]?.url ? [detail.images[0].url] : [] } };
}

export default async function ProductPage({ params }: Route) {
  const { storeId, slug } = await params;
  const [store, detail] = await Promise.all([catalogStore(storeId), productDetail(storeId, slug)]);
  if (!store || !detail) notFound();
  const labels = catalogLabels(store.default_locale);
  return <main className="mx-auto grid max-w-6xl gap-8 p-4 md:grid-cols-2">
    <div className="space-y-3">{detail.images.map((image, index) => <img key={image.url} src={image.url}
      alt={image.alt_text ?? detail.product.name} width={800} height={800} loading={index ? 'lazy' : 'eager'}
      className="aspect-square w-full rounded-xl object-cover" />)}</div>
    <div className="space-y-5"><h1 className="text-3xl font-bold">{detail.product.name}</h1>
      {detail.product.description && <section><h2 className="font-semibold">{labels.description}</h2>
        <p className="whitespace-pre-wrap">{detail.product.description}</p></section>}
      <VariantPicker variants={detail.variants} currency={store.currency} locale={store.default_locale}
        storeId={storeId} productId={detail.product.id} labels={labels} />
    </div>
  </main>;
}
