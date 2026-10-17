'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { joinWithPassword, type JoinState } from './actions';

export function JoinForm({ kind, token, defaultName, loginHref, labels }: {
  kind: 'platform' | 'store'; token: string; defaultName: string; loginHref: string;
  labels: Record<'fullName' | 'password' | 'passwordHelp' | 'create' | 'exists' | 'signIn' | 'error' | 'invalid', string>;
}) {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinWithPassword, {});
  return <form action={action} className="flex flex-col gap-5">
    <input type="hidden" name="kind" value={kind} /><input type="hidden" name="token" value={token} />
    <label className="block font-semibold">{labels.fullName}
      <input className="auth-input font-normal" name="fullName" autoComplete="name" maxLength={120} defaultValue={defaultName} /></label>
    <label className="block font-semibold">{labels.password}
      <input className="auth-input font-normal" type="password" name="password" autoComplete="new-password" minLength={8} required
        aria-describedby="join-password-help" />
      <span id="join-password-help" className="mt-1 block text-sm font-normal text-[#a3a9b8]">{labels.passwordHelp}</span></label>
    {state.error === 'exists' ? <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#6b4a1f] bg-[#3d3115] p-4 text-[#f5c77a]">
        {labels.exists}<Link href={loginHref} className="auth-secondary self-start">{labels.signIn}</Link></div>
      : state.error && <p role="alert" className="m-0 rounded-xl border border-[#6b2e36] bg-[#3b1a20] p-3 text-[#ff9aa5]">
        {state.error === 'invalid' ? labels.invalid : labels.error}</p>}
    <button className="auth-primary w-full" type="submit" disabled={pending}>{labels.create}</button>
  </form>;
}
