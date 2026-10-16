import { adminText } from '../../../lib/locale';
import { panelContext } from '../../../lib/panel-data';
import { PanelShell } from '../../panel-shell';
import { CategoryManager } from './category-manager';

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const [params, t] = await Promise.all([searchParams, adminText()]);
  const context = await panelContext(params.store);
  const { data, error } = await context.client.from('categories').select('id,name,parent_id,position')
    .eq('store_id', context.selected.id).order('position');
  if (error) throw error;
  return <PanelShell context={context} active="products"><main className="space-y-5 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{t('products.categories')}</h1>
    <CategoryManager storeId={context.selected.id} initial={data ?? []} labels={{
      name: t('products.categoryName'), parent: t('products.parent'), create: t('products.createCategory'),
      up: t('products.moveUp'), down: t('products.moveDown'), none: t('products.none'), error: t('products.saveError'),
    }} />
  </main></PanelShell>;
}
