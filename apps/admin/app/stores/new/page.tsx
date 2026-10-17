import { messages, isLocale } from '@plataforma/i18n';
import { adminLocale, adminText } from '../../../lib/locale';
import { currentViewer } from '../../../lib/viewer';
import { StoreWizard } from './store-wizard';

export default async function NewStorePage() {
  const [t, viewer, locale] = await Promise.all([adminText(), currentViewer(), adminLocale()]);
  const { count } = await viewer.client.from('store_members').select('store_id', { count: 'exact', head: true })
    .eq('user_id', viewer.userId).eq('role', 'owner');
  const owned = count ?? 0;
  const blocked = !viewer.isAdmin && (!viewer.canCreateStores ? 'noPermission' : owned >= viewer.maxStores ? 'quotaFull' : null);
  const back = viewer.isAdmin ? '/platform' : '/';
  const keys = ['title', 'nameStep', 'name', 'address', 'addressAvailable', 'addressUsed',
    'addressInvalid', 'checking', 'industryStep', 'industry', 'general', 'countryStep',
    'country', 'advanced', 'locale', 'timezone', 'finishStep', 'logo', 'skipLogo',
    'palette', 'preview', 'back', 'next', 'finish', 'progress', 'creating', 'invalid', 'limit', 'failed'] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, key === 'progress' ? t.raw('createStore.progress') as string : t(`createStore.${key}`)])) as Record<(typeof keys)[number], string>;
  const industries = { mascotas: t('industries.mascotas'), 'carpinteria-muebles': t('industries.carpinteria-muebles'),
    'ropa-accesorios': t('industries.ropa-accesorios'), 'comida-casera': t('industries.comida-casera'), general: t('industries.general') };
  const previewKeys = ['heading', 'welcome', 'slogan', 'cta', 'cart', 'yourBusiness', 'next',
    'helpName', 'helpIndustry', 'helpCountry', 'helpStyle'] as const;
  const preview = Object.fromEntries(previewKeys.map((key) => [key, t.raw(`wizardPreview.${key}`) as string])) as Record<(typeof previewKeys)[number], string>;
  const paletteNames = { calido: t('themeOptions.calido'), fresco: t('themeOptions.fresco'), natural: t('themeOptions.natural'),
    elegante: t('themeOptions.elegante'), vibrante: t('themeOptions.vibrante') };
  const templates = messages[isLocale(locale) ? locale : 'es-419'].blocks.templates;
  const intros = { mascotas: templates.mascotas.intro, 'carpinteria-muebles': templates['carpinteria-muebles'].intro,
    'ropa-accesorios': templates['ropa-accesorios'].intro, 'comida-casera': templates['comida-casera'].intro, general: templates.general.intro };
  return <main className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-8 md:px-6">
    <a href={back} className="self-start text-[15px] no-underline">← {viewer.isAdmin ? t('shell.console') : t('wizardPreview.back')}</a>
    <h1 className="sr-only">{labels.title}</h1>
    {blocked
      ? <div role="status" className="panel-card flex flex-col gap-4 p-6">
          <p className="m-0 text-lg">{t(`wizardPreview.${blocked}`, { count: viewer.maxStores })}</p>
          <a className="auth-secondary self-start" href={back}>{t('wizardPreview.back')}</a>
        </div>
      : <StoreWizard labels={labels} industries={industries} preview={preview} paletteNames={paletteNames} intros={intros} />}
  </main>;
}
