'use client';

import { useEffect, useReducer, useState } from 'react';
import { getBlockDefinition, registry } from '@plataforma/blocks';
import { isLocale, messages } from '@plataforma/i18n';
import { editorReducer, moveBlock, setField, type EditorBlock } from '../../../lib/editor-state';
import { EditorField } from './editor-field';
import { saveDraftBlocks } from './actions';

type Asset = { id: string; path: string; alt_text: string | null; size_bytes: number };
type Choice = { id: string; name: string };
type Labels = Record<'title' | 'sections' | 'add' | 'edit' | 'design' | 'simple' | 'advanced' | 'up' | 'down' |
  'duplicate' | 'hide' | 'show' | 'delete' | 'undo' | 'redo' | 'saved' | 'saving' | 'error' |
  'addItem' | 'removeItem' | 'choose' | 'empty' | 'view' | 'list', string>;
type MediaLabels = { choose: string; upload: string; camera: string; alt: string; suggestion: string;
  invalid: string; failed: string; selected: string; empty: string };

export function BlockEditor({ storeId, pageId, initial, assets, products, categories, locale, labels, mediaLabels }: {
  storeId: string; pageId: string; initial: EditorBlock[]; assets: Asset[]; products: Choice[];
  categories: Choice[]; locale: string; labels: Labels; mediaLabels: MediaLabels;
}) {
  const [state, dispatch] = useReducer(editorReducer, { past: [], present: initial, future: [] });
  const [selected, setSelected] = useState(initial[0]?.id ?? '');
  const [advanced, setAdvanced] = useState(false);
  const [catalog, setCatalog] = useState(false);
  const [design, setDesign] = useState(false);
  const [mobileStep, setMobileStep] = useState<'list' | 'edit' | 'view'>('list');
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const dictionary = messages[isLocale(locale) ? locale : 'es-419'].blocks as unknown as Record<string, string>;
  const chosen = state.present.find((block) => block.id === selected);
  const definition = chosen && getBlockDefinition(chosen.type);
  const change = (blocks: EditorBlock[]) => { dispatch({ type: 'change', blocks }); setStatus('saving'); };
  const update = (id: string, patch: (block: EditorBlock) => EditorBlock) =>
    change(state.present.map((block) => block.id === id ? patch(block) : block));

  useEffect(() => {
    if (status !== 'saving') return;
    let active = true;
    const timer = setTimeout(() => { void saveDraftBlocks({ storeId, pageId, blocks: state.present }).then((result) => {
      if (active) setStatus(result.error ? 'error' : 'saved');
    }).catch(() => { if (active) setStatus('error'); }); }, 1500);
    return () => { active = false; clearTimeout(timer); };
  }, [state.present, status, storeId, pageId]);

  const select = (id: string) => { setSelected(id); setCatalog(false); setDesign(false); setMobileStep('edit'); };
  const add = (type: string) => {
    const item = getBlockDefinition(type);
    if (!item) return;
    const block = { id: crypto.randomUUID(), type, version: item.version, variant: item.defaultVariant, props: item.defaults };
    change([...state.present, block]); select(block.id);
  };
  const editField = (path: string, value: unknown) => {
    if (!chosen) return;
    update(chosen.id, (block) => {
      const oldCta = block.props && typeof block.props === 'object' && 'cta' in block.props &&
        block.props.cta && typeof block.props.cta === 'object' ? block.props.cta as Record<string, unknown> : {};
      const props = path === 'cta.label' ? { ...setField(block.props, path, value),
        cta: { ...oldCta, label: value, link: oldCta.link ?? { kind: 'collection', categoryId: null } } } :
        setField(block.props, path, value);
      return { ...block, props };
    });
  };
  const history = (type: 'undo' | 'redo') => { dispatch({ type }); setStatus('saving'); };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2"><h1 className="mr-auto text-2xl font-bold">{labels.title}</h1>
      <span role="status" aria-live="polite">{labels[status]}</span>
      <button type="button" className="auth-secondary" disabled={!state.past.length} onClick={() => history('undo')}>{labels.undo}</button>
      <button type="button" className="auth-secondary" disabled={!state.future.length} onClick={() => history('redo')}>{labels.redo}</button>
    </div>
    <div className="grid gap-4 md:grid-cols-[minmax(15rem,1fr)_minmax(18rem,2fr)]">
      <section className={`${mobileStep !== 'list' ? 'hidden md:block' : ''} space-y-3`}>
        <h2 className="text-xl font-semibold">{labels.sections}</h2>
        {!state.present.length && <p>{labels.empty}</p>}
        <ol className="space-y-2">{state.present.map((block, index) => {
          const item = getBlockDefinition(block.type);
          return <li key={block.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
            onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
              event.preventDefault(); change(moveBlock(state.present, Number(event.dataTransfer.getData('text/plain')), index));
            }} className="rounded-lg border p-3">
            <button type="button" className="min-h-11 w-full text-left font-semibold" onClick={() => select(block.id)}>
              {dictionary[item?.i18n.name.replace(/^blocks\./, '') ?? ''] ?? block.type}{block.hidden ? ` (${labels.hide})` : ''}</button>
            <div className="flex flex-wrap gap-2 text-sm">
              <button type="button" aria-label={labels.up} disabled={index === 0} onClick={() => change(moveBlock(state.present, index, index - 1))}>{labels.up}</button>
              <button type="button" aria-label={labels.down} disabled={index === state.present.length - 1}
                onClick={() => change(moveBlock(state.present, index, index + 1))}>{labels.down}</button>
              <button type="button" onClick={() => { const copy = { ...block, id: crypto.randomUUID() };
                change([...state.present.slice(0, index + 1), copy, ...state.present.slice(index + 1)]); select(copy.id); }}>{labels.duplicate}</button>
              <button type="button" onClick={() => update(block.id, (current) => ({ ...current, hidden: !current.hidden }))}>
                {block.hidden ? labels.show : labels.hide}</button>
              <button type="button" onClick={() => { change(state.present.filter((item) => item.id !== block.id));
                if (selected === block.id) setSelected(''); }}>{labels.delete}</button>
            </div>
          </li>;
        })}</ol>
        <button type="button" className="auth-primary" onClick={() => setCatalog(!catalog)}>{labels.add}</button>
        {catalog && <div className="grid grid-cols-2 gap-2">{registry.map((item) => <button type="button" key={item.type}
          className="min-h-24 rounded border p-2" onClick={() => add(item.type)}>
          <img src={item.variants[0]?.thumbnail} alt="" width={120} height={72} />
          {dictionary[item.i18n.name.replace(/^blocks\./, '')] ?? item.type}</button>)}</div>}
      </section>
      <section className={`${mobileStep === 'list' ? 'hidden md:block' : ''} space-y-4`}>
        <button type="button" className="auth-secondary md:hidden" onClick={() => setMobileStep('list')}>{labels.list}</button>
        {chosen && definition && <><h2 className="text-xl font-semibold">{dictionary[definition.i18n.name.replace(/^blocks\./, '')]}</h2>
          <button type="button" className="auth-secondary" onClick={() => setDesign(!design)}>{labels.design}</button>
          {design && <div className="grid grid-cols-2 gap-2">{definition.variants.map((variant) => <button type="button"
            key={variant.id} aria-pressed={chosen.variant === variant.id} className="min-h-24 rounded border-2 p-2 aria-pressed:border-sky-700"
            onMouseEnter={() => undefined} onClick={() => update(chosen.id, (block) => ({ ...block, variant: variant.id }))}>
            <img src={variant.thumbnail} alt="" width={120} height={72} />
            {dictionary[variant.i18n.name.replace(/^blocks\./, '')] ?? variant.id}</button>)}</div>}
          <button type="button" className="auth-secondary" onClick={() => setAdvanced(!advanced)}>{advanced ? labels.simple : labels.advanced}</button>
          <div className="space-y-4">{definition.fields.filter((field) => advanced || field.simple).map((field) => {
            const source = chosen.props && typeof chosen.props === 'object' ? chosen.props as Record<string, unknown> : {};
            const value = field.name.split('.').reduce<unknown>((current, key) => current && typeof current === 'object' && key in current ?
              (current as Record<string, unknown>)[key] : undefined, source);
            return <EditorField key={`${chosen.id}-${field.name}`} field={field} value={value} change={(next) => editField(field.name, next)}
              storeId={storeId} assets={assets} products={products} categories={categories} text={dictionary}
              mediaText={mediaLabels} addItem={labels.addItem} removeItem={labels.removeItem} />;
          })}</div>
        </>}
      </section>
    </div>
  </div>;
}
