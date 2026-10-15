import { notFound } from 'next/navigation';
import { UiCatalog } from './ui-catalog';

export default function UiPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <UiCatalog />;
}
