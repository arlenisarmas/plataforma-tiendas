'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@plataforma/core';
import { StepWizard } from '@plataforma/ui';
import { templateKinds, templatePalettes, type TemplateKind } from '@plataforma/blocks';
import { compressImage } from '../../../lib/compress-image';
import { countryCodes, countryDefaults } from '../../../lib/store-setup';

/** Nombres de países en el idioma de la persona, ordenados alfabéticamente (sin textos fijos). */
function countryOptions(locale: string) {
  const names = new Intl.DisplayNames([locale], { type: 'region' });
  return countryCodes
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
import { checkStoreSlug, createStoreAction } from './actions';

type Labels = Record<
  | 'title'
  | 'nameStep'
  | 'name'
  | 'address'
  | 'addressAvailable'
  | 'addressUsed'
  | 'addressInvalid'
  | 'checking'
  | 'industryStep'
  | 'industry'
  | 'general'
  | 'countryStep'
  | 'country'
  | 'advanced'
  | 'locale'
  | 'timezone'
  | 'finishStep'
  | 'logo'
  | 'skipLogo'
  | 'palette'
  | 'preview'
  | 'back'
  | 'next'
  | 'finish'
  | 'progress'
  | 'creating'
  | 'invalid'
  | 'limit'
  | 'failed',
  string
>;

export function StoreWizard({
  labels,
  industries,
}: {
  labels: Labels;
  industries: Record<TemplateKind, string>;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [availability, setAvailability] = useState<
    'checking' | 'disponible' | 'en_uso' | 'invalida'
  >('invalida');
  const [country, setCountry] = useState<keyof typeof countryDefaults>('AR');
  const [locale, setLocale] = useState<string>(countryDefaults.AR.locale);
  const [timezone, setTimezone] = useState<string>(countryDefaults.AR.timezone);
  const [advanced, setAdvanced] = useState(false);
  const [palette, setPalette] = useState('fresco');
  const [industry, setIndustry] = useState<TemplateKind>('general');
  const [logo, setLogo] = useState<File>();
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!slug || slug.length < 3) return;
    const timeout = setTimeout(() => {
      void checkStoreSlug(slug)
        .then(setAvailability)
        .catch(() => setAvailability('invalida'));
    }, 350);
    return () => clearTimeout(timeout);
  }, [slug]);

  const changeName = (value: string) => {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
      setAvailability('checking');
    }
  };
  const changeCountry = (value: keyof typeof countryDefaults) => {
    setCountry(value);
    setLocale(countryDefaults[value].locale);
    setTimezone(countryDefaults[value].timezone);
  };
  const complete = () =>
    start(async () => {
      setError('');
      const form = new FormData();
      for (const [key, value] of Object.entries({
        name,
        slug,
        industry,
        country,
        locale,
        timezone,
        palette,
      }))
        form.set(key, value);
      if (logo) {
        try {
          form.set('logo', await compressImage(logo));
        } catch {
          setError(labels.invalid);
          return;
        }
      }
      const result = await createStoreAction(form).catch(() => ({ error: 'failed' as const }));
      if (result.error) {
        setError(
          result.error === 'used'
            ? labels.addressUsed
            : result.error === 'limit'
              ? labels.limit
              : result.error === 'invalid'
                ? labels.invalid
                : labels.failed,
        );
        return;
      }
      router.push(`/?store=${result.storeId}`);
    });

  const fieldClass = 'auth-input';
  const steps = [
    {
      title: labels.nameStep,
      fields: [
        <label key="name" className="block font-semibold">
          {labels.name}
          <input
            className={fieldClass}
            value={name}
            maxLength={80}
            onChange={(event) => changeName(event.target.value)}
          />
        </label>,
        <div key="slug">
          <label className="block font-semibold">
            {labels.address}
            <input
              className={fieldClass}
              value={slug}
              maxLength={40}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value.toLowerCase());
                setAvailability('checking');
              }}
            />
          </label>
          <p className="mt-2" role="status">
            {slug.length < 3 || availability === 'invalida'
              ? labels.addressInvalid
              : availability === 'en_uso'
                ? labels.addressUsed
                : availability === 'disponible'
                  ? labels.addressAvailable
                  : labels.checking}
          </p>
        </div>,
      ],
    },
    {
      title: labels.industryStep,
      fields: [
        <label key="industry" className="block font-semibold">
          {labels.industry}
          <select
            className={fieldClass}
            value={industry}
            onChange={(event) => {
              const next = event.target.value as TemplateKind;
              setIndustry(next);
              setPalette(templatePalettes[next]);
            }}
          >
            {templateKinds.map((kind) => (
              <option key={kind} value={kind}>
                {industries[kind]}
              </option>
            ))}
          </select>
        </label>,
      ],
    },
    {
      title: labels.countryStep,
      fields: [
        <label key="country" className="block font-semibold">
          {labels.country}
          <select
            className={fieldClass}
            value={country}
            onChange={(event) => changeCountry(event.target.value as keyof typeof countryDefaults)}
          >
            {countryOptions(locale).map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>,
        <div key="advanced">
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={advanced}
              onChange={(event) => setAdvanced(event.target.checked)}
            />
            {labels.advanced}
          </label>
          {advanced && (
            <div className="space-y-3">
              <label className="block font-semibold">
                {labels.locale}
                <select
                  className={fieldClass}
                  value={locale}
                  onChange={(event) => setLocale(event.target.value)}
                >
                  <option value="es-419">Español</option>
                  <option value="es-AR">Español (Argentina)</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="block font-semibold">
                {labels.timezone}
                <input
                  className={fieldClass}
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                />
              </label>
            </div>
          )}
        </div>,
      ],
    },
    {
      title: labels.finishStep,
      fields: [
        <div key="logo">
          <label className="block font-semibold">
            {labels.logo}
            <input
              className={fieldClass}
              type="file"
              accept="image/*"
              onChange={(event) => setLogo(event.target.files?.[0])}
            />
          </label>
          <p className="mt-1 text-sm">{labels.skipLogo}</p>
        </div>,
        <div key="palette">
          <label className="block font-semibold">
            {labels.palette}
            <select
              className={fieldClass}
              value={palette}
              onChange={(event) => setPalette(event.target.value)}
            >
              {['calido', 'fresco', 'natural', 'elegante', 'vibrante'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 rounded-xl border border-[#2a2f3c] p-4" aria-label={labels.preview}>
            <div
              className={`h-12 rounded-lg ${palette === 'fresco' ? 'bg-[#5b5fe0]' : palette === 'natural' ? 'bg-[#2f7d5b]' : palette === 'calido' ? 'bg-[#9b2c3a]' : palette === 'elegante' ? 'bg-violet-950' : 'bg-pink-900'}`}
            />
          </div>
        </div>,
      ],
    },
  ];
  return (
    <div className="space-y-4">
      <StepWizard
        steps={steps}
        labels={{
          back: labels.back,
          next: labels.next,
          finish: pending ? labels.creating : labels.finish,
          progress: (step, total) =>
            labels.progress.replace('{step}', String(step)).replace('{total}', String(total)),
        }}
        canAdvance={(index) =>
          index !== 0 || (name.trim().length > 0 && availability === 'disponible')
        }
        busy={pending}
        onComplete={complete}
      />
      {error && (
        <p role="alert" className="text-[#ff9aa5]">
          {error}
        </p>
      )}
    </div>
  );
}
