import { messages } from '@plataforma/i18n';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">{messages.storefront.title}</h1>
      <p className="mt-4">{messages.storefront.description}</p>
    </main>
  );
}
