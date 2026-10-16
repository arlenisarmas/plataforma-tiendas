'use client';

import { useState } from 'react';
import { createTheme, curatedPalettes, type Theme } from '@plataforma/blocks';
import { publishTheme, saveTheme } from './publish-actions';

type Labels = Record<'theme' | 'palette' | 'font' | 'radius' | 'header' | 'footer' | 'publishTheme' |
  'saved' | 'error' | 'saveTheme' | 'searchHeader' | 'socialFooter' | 'paymentsFooter' | 'footerText', string>;

export function ThemeEditor({ storeId, initial, labels, options, onChange }: { storeId: string; initial: Theme;
  labels: Labels; options: Record<string, string>; onChange: (theme: Theme) => void }) {
  const [theme, setTheme] = useState(initial);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const change = (next: Theme) => { setTheme(next); onChange(next); setMessage(''); };
  const submit = async (publish: boolean) => {
    setPending(true);
    const result = publish ? await publishTheme({ storeId, theme }) : await saveTheme({ storeId, theme });
    setMessage(result.error ? labels.error : labels.saved);
    setPending(false);
  };
  return <section className="space-y-3 rounded-xl border p-4"><h2 className="text-xl font-semibold">{labels.theme}</h2>
    <label className="block">{labels.palette}<select className="auth-input" value={theme.palette}
      onChange={(event) => { const palette = event.target.value as keyof typeof curatedPalettes;
        change({ ...theme, palette, colors: createTheme(palette).colors }); }}>
      {Object.keys(curatedPalettes).map((name) => <option key={name} value={name}>{options[name] ?? name}</option>)}</select></label>
    <label className="block">{labels.font}<select className="auth-input" value={theme.fonts}
      onChange={(event) => change({ ...theme, fonts: event.target.value as Theme['fonts'] })}>
      {['moderna', 'clasica', 'amigable', 'robusta'].map((name) => <option key={name} value={name}>{options[name] ?? name}</option>)}</select></label>
    <label className="block">{labels.radius}<select className="auth-input" value={theme.radius}
      onChange={(event) => change({ ...theme, radius: event.target.value as Theme['radius'] })}>
      {['recto', 'suave', 'redondo'].map((name) => <option key={name} value={name}>{options[name] ?? name}</option>)}</select></label>
    <label className="block">{labels.header}<select className="auth-input" value={theme.header.layout}
      onChange={(event) => change({ ...theme, header: { ...theme.header, layout: event.target.value as Theme['header']['layout'] } })}>
      {['izquierda', 'centrado'].map((name) => <option key={name} value={name}>{options[name] ?? name}</option>)}</select></label>
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={theme.header.showSearch}
      onChange={(event) => change({ ...theme, header: { ...theme.header, showSearch: event.target.checked } })} />{labels.searchHeader}</label>
    <label className="block">{labels.footerText}<input className="auth-input" value={theme.footer.text ?? ''}
      onChange={(event) => change({ ...theme, footer: { ...theme.footer, text: event.target.value } })} /></label>
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={theme.footer.showSocial}
      onChange={(event) => change({ ...theme, footer: { ...theme.footer, showSocial: event.target.checked } })} />{labels.socialFooter}</label>
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={theme.footer.showPaymentIcons}
      onChange={(event) => change({ ...theme, footer: { ...theme.footer, showPaymentIcons: event.target.checked } })} />{labels.paymentsFooter}</label>
    <div className="flex flex-wrap gap-2"><button type="button" className="auth-secondary" disabled={pending}
      onClick={() => void submit(false)}>{labels.saveTheme}</button>
      <button type="button" className="auth-primary" disabled={pending}
        onClick={() => void submit(true)}>{labels.publishTheme}</button></div>
    {message && <p role="status">{message}</p>}
  </section>;
}
