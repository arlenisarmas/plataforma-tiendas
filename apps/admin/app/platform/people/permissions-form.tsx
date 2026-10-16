'use client';

import { useState, useTransition } from 'react';
import { savePermissions } from '../actions';

type Labels = { canCreate: string; canCreateHelp: string; maxStores: string; paused: string; pausedHelp: string;
  save: string; saved: string; error: string };

function Toggle({ checked, onChange, label, help, disabled }: {
  checked: boolean; onChange: (value: boolean) => void; label: string; help: string; disabled?: boolean;
}) {
  return <div className="flex min-h-[56px] items-center justify-between gap-4 border-b border-[#232733] py-2">
    <span className="flex flex-col"><span className="text-[15px] font-semibold">{label}</span><span className="text-[13px] text-[#a3a9b8]">{help}</span></span>
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={`flex h-[30px] w-[52px] shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-50 ${checked ? 'justify-end bg-[#5b5fe0]' : 'justify-start bg-[#3a3f55]'}`}>
      <span aria-hidden="true" className="block h-6 w-6 rounded-full bg-white" />
    </button>
  </div>;
}

export function PermissionsForm({ userId, initial, self, labels }: {
  userId: string; initial: { canCreate: boolean; maxStores: number; paused: boolean }; self: boolean; labels: Labels;
}) {
  const [canCreate, setCanCreate] = useState(initial.canCreate);
  const [maxStores, setMaxStores] = useState(Math.max(initial.maxStores, 1));
  const [paused, setPaused] = useState(initial.paused);
  const [message, setMessage] = useState('');
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    const result = await savePermissions({ userId, canCreate, maxStores: canCreate ? maxStores : initial.maxStores, paused });
    setMessage(result.error ? labels.error : labels.saved);
  });
  return <div className="flex flex-col gap-1">
    <Toggle checked={canCreate} onChange={setCanCreate} label={labels.canCreate} help={labels.canCreateHelp} />
    {canCreate && <label className="flex min-h-[56px] items-center justify-between gap-4 border-b border-[#232733] text-[15px] font-semibold">
      {labels.maxStores}
      <select className="auth-input mt-0 w-24" value={maxStores} onChange={(event) => setMaxStores(Number(event.target.value))}>
        {[1, 2, 3, 4, 5, 10, 20].map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>}
    <Toggle checked={paused} onChange={setPaused} label={labels.paused} help={labels.pausedHelp} disabled={self} />
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button type="button" className="auth-primary" disabled={pending} onClick={save}>{labels.save}</button>
      {message && <span role="status" className="text-sm text-[#c9cdd8]">{message}</span>}
    </div>
  </div>;
}
