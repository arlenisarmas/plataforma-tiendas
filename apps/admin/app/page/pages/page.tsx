import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { PanelShell } from '../../panel-shell';
import { PageManager } from './page-manager';

export default async function PagesPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const { data, error } = await context.client.from('pages').select('id,title,slug,show_in_nav,nav_position')
    .eq('store_id', context.selected.id).order('nav_position');
  if (error) throw error;
  const keys = ['pages', 'createPage', 'pageName', 'pageSlug', 'nav', 'savePage', 'saved', 'error', 'edit', 'up', 'down'] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, t(`editor.${key}`)])) as Record<(typeof keys)[number], string>;
  return <PanelShell context={context} active="page"><main className="mx-auto max-w-3xl p-4 md:p-8">
    <PageManager storeId={context.selected.id} initial={data ?? []} labels={labels} />
  </main></PanelShell>;
}
