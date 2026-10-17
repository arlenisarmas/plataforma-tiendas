import { RenderStorePage } from '../../../lib/render-store-page';
export default async function Home({ params }: { params: Promise<{ storeId: string }> }) {
  return <RenderStorePage storeId={(await params).storeId} />;
}
