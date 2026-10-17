import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { MediaPicker } from '../../media-picker';
import { PanelShell } from '../../panel-shell';

export default async function MediaLibrary({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [{ store }, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(store);
  const { data, error } = await context.client.from('media_assets').select('id,path,alt_text,size_bytes')
    .eq('store_id', context.selected.id).eq('bucket', 'store-media').eq('kind', 'image')
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return <PanelShell context={context} active="page"><main className="space-y-5 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{t('media.title')}</h1>
    <MediaPicker storeId={context.selected.id} folder="library" initial={data ?? []} labels={{
      choose: t('media.choose'), upload: t('media.upload'), camera: t('media.camera'),
      alt: t('media.alt'), suggestion: t('media.suggestion'), invalid: t('media.invalid'),
      failed: t('media.failed'), selected: t('media.selected'), empty: t('media.empty'),
    }} />
  </main></PanelShell>;
}
