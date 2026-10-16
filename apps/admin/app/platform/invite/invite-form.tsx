'use client';

import { useActionState, useState } from 'react';
import { createInvitation, type InviteResult } from '../actions';

type Labels = Record<'what' | 'own' | 'ownHelp' | 'help' | 'helpHelp' | 'name' | 'email' | 'maxStores' | 'createNow'
  | 'storeName' | 'country' | 'store' | 'role' | 'roleStaff' | 'roleOwner' | 'alsoCreate' | 'send' | 'sendCreate'
  | 'mailPreview' | 'mailHeading' | 'mailBody' | 'mailButton' | 'mailFoot' | 'sent' | 'link' | 'error' | 'storeError', string>;

export function InviteForm({ labels, stores, countries }: {
  labels: Labels; stores: { id: string; name: string }[]; countries: { code: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<InviteResult, FormData>(createInvitation, {});
  const [mode, setMode] = useState<'own' | 'help'>('own');
  const [createNow, setCreateNow] = useState(false);
  const [name, setName] = useState('');
  const card = (active: boolean) => `flex min-h-11 flex-col items-start gap-1.5 rounded-[14px] border-2 p-4 text-left ${active ? 'border-[#8c90ff] bg-[#232850]' : 'border-[#2a2f3c] bg-[#0e1016]'}`;
  return <div className="flex flex-wrap items-start gap-6">
    <form action={action} className="panel-card flex min-w-0 flex-[3_1_520px] flex-col gap-6 p-6 md:p-7">
      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-3 text-base font-bold">{labels.what}</legend>
        <input type="hidden" name="mode" value={mode} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <button type="button" aria-pressed={mode === 'own'} onClick={() => setMode('own')} className={card(mode === 'own')}>
            <strong className="text-base">{labels.own}</strong><span className="text-sm text-[#c9cdd8]">{labels.ownHelp}</span></button>
          <button type="button" aria-pressed={mode === 'help'} onClick={() => setMode('help')} className={card(mode === 'help')}>
            <strong className="text-base">{labels.help}</strong><span className="text-sm text-[#c9cdd8]">{labels.helpHelp}</span></button>
        </div>
      </fieldset>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <label className="font-semibold">{labels.name}<input className="auth-input font-normal" name="name" maxLength={120} autoComplete="off"
          value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="font-semibold">{labels.email}<input className="auth-input font-normal" name="email" type="email" required maxLength={254} autoComplete="off" /></label>
      </div>
      {mode === 'own' ? <>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name="createNow" checked={createNow} onChange={(event) => setCreateNow(event.target.checked)} className="h-5 w-5 accent-[#5b5fe0]" />
          {labels.createNow}</label>
        {createNow && <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <label className="font-semibold">{labels.storeName}<input className="auth-input font-normal" name="storeName" required maxLength={80} /></label>
          <label className="font-semibold">{labels.country}<select className="auth-input font-normal" name="country" defaultValue="AR">
            {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
        </div>}
        {createNow && <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="alsoCreate" className="h-5 w-5 accent-[#5b5fe0]" />{labels.alsoCreate}</label>}
        <label className="flex items-center justify-between gap-4 font-semibold">{labels.maxStores}
          <select className="auth-input mt-0 w-24 font-normal" name="maxStores" defaultValue="1">
            {[1, 2, 3, 4, 5, 10].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </> : <>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <label className="font-semibold">{labels.store}<select className="auth-input font-normal" name="storeId" required>
            {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label>
          <label className="font-semibold">{labels.role}<select className="auth-input font-normal" name="role" defaultValue="staff">
            <option value="staff">{labels.roleStaff}</option><option value="owner">{labels.roleOwner}</option></select></label>
        </div>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="alsoCreate" className="h-5 w-5 accent-[#5b5fe0]" />{labels.alsoCreate}</label>
        <input type="hidden" name="maxStores" value="1" />
      </>}
      {state.error && <p role="alert" className="m-0 rounded-xl border border-[#6b2e36] bg-[#3b1a20] p-3 text-[#ff9aa5]">
        {state.error === 'store' ? labels.storeError : labels.error}</p>}
      {state.ok && <div role="status" className="flex flex-col gap-2 rounded-xl border border-[#2f7d5b] bg-[#173b2e] p-4 text-[#7ee2b3]">
        <strong>{labels.sent.replace('{email}', state.ok.email)}</strong>
        <span className="text-sm text-[#c9cdd8]">{labels.link}</span>
        <input readOnly value={state.ok.link} aria-label={labels.link} className="auth-input mt-0 text-sm" onFocus={(event) => event.currentTarget.select()} />
      </div>}
      <div className="flex justify-end border-t border-[#232733] pt-5">
        <button type="submit" className="auth-primary" disabled={pending}>{mode === 'own' && createNow ? labels.sendCreate : labels.send}</button>
      </div>
    </form>
    <aside aria-label={labels.mailPreview} className="flex min-w-0 flex-[2_1_340px] flex-col gap-3">
      <span className="text-sm font-semibold text-[#a3a9b8]">{labels.mailPreview}</span>
      <div className="flex flex-col gap-3.5 rounded-2xl bg-[#f6f7fb] p-7 text-[#1b2030]">
        <h2 className="m-0 text-[22px] font-extrabold">{labels.mailHeading.replace('{name}', name.trim() || '…')}</h2>
        <p className="m-0 text-[15px] leading-relaxed">{labels.mailBody}</p>
        <span className="self-start rounded-[10px] bg-[#4549c9] px-5 py-3.5 text-[15px] font-bold text-white">{labels.mailButton}</span>
        <p className="m-0 text-[13px] text-[#4a5068]">{labels.mailFoot}</p>
      </div>
    </aside>
  </div>;
}
