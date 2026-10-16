import { adminText } from '../../../lib/locale';
import { StoreWizard } from './store-wizard';

export default async function NewStorePage() {
  const t = await adminText();
  const keys = ['title', 'nameStep', 'name', 'address', 'addressAvailable', 'addressUsed',
    'addressInvalid', 'checking', 'industryStep', 'industry', 'general', 'countryStep',
    'country', 'advanced', 'locale', 'timezone', 'finishStep', 'logo', 'skipLogo',
    'palette', 'preview', 'back', 'next', 'finish', 'progress', 'creating', 'invalid', 'limit', 'failed'] as const;
  const labels = Object.fromEntries(keys.map((key) => [key, key === 'progress' ? t.raw('createStore.progress') as string : t(`createStore.${key}`)])) as Record<(typeof keys)[number], string>;
  return <main className="mx-auto max-w-xl space-y-6 p-4 md:p-8">
    <h1 className="text-3xl font-bold">{labels.title}</h1>
    <StoreWizard labels={labels} />
  </main>;
}
