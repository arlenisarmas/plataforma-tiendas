import Link from 'next/link';
import { adminText } from '../../../lib/locale';
import { platformStores } from '../../../lib/platform-data';
import { Panel, StoresTable } from '../parts';
import { PlatformShell } from '../platform-shell';

export default async function PlatformStoresPage() {
  const t = await adminText();
  return <PlatformShell active="stores">{async (viewer) => {
    const stores = await platformStores(viewer.client);
    return <main className="flex flex-col gap-6 px-4 py-7 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-3xl">{t('platform.stores')}</h1>
        <Link href="/stores/new" className="auth-primary">+ {t('platform.createStore')}</Link>
      </header>
      <Panel title={`${t('platform.stores')} · ${stores.length}`}><StoresTable stores={stores} /></Panel>
    </main>;
  }}</PlatformShell>;
}
