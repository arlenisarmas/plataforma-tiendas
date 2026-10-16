'use client';

import { useActionState } from 'react';
import { resendInvitation } from '../actions';

export function ResendButton({ id, email, name, label, linkLabel }: {
  id: string; email: string; name: string | null; label: string; linkLabel: string;
}) {
  const [state, action, pending] = useActionState(resendInvitation, {});
  return <form action={action} className="flex flex-col gap-2">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="email" value={email} />
    {name && <input type="hidden" name="name" value={name} />}
    <button type="submit" disabled={pending} className="min-h-10 rounded-lg px-3 text-sm text-[#afb4ff] underline">{label}</button>
    {state.link && <input readOnly value={state.link} aria-label={linkLabel} className="auth-input mt-0 text-xs" onFocus={(event) => event.currentTarget.select()} />}
  </form>;
}
