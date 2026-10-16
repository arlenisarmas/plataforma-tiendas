import { RenderStorePage } from '../../../../lib/render-store-page';
export default async function CustomPage({ params }: { params: Promise<{ storeId: string; slug: string }> }) {
  const { storeId, slug } = await params;
  return <RenderStorePage storeId={storeId} slug={slug} />;
}
