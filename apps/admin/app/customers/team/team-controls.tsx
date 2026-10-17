'use client';

import { useState, useTransition } from 'react';
import { changeMemberRole, inviteMember, leaveStore, removeMember } from './actions';

type Labels = Record<'title' | 'back' | 'invite' | 'email' | 'role' | 'owner' | 'staff' | 'send' |
  'link' | 'pending' | 'members' | 'remove' | 'removeConfirm' | 'leave' | 'leaveConfirm' | 'saved' | 'error', string>;

export function TeamControls({ storeId, selfId, isOwner, members, invitations, labels }: { storeId: string; selfId: string;
  isOwner: boolean; members: { user_id: string; role: 'owner' | 'staff' }[];
  invitations: { id: string; email: string; role: string; expires_at: string }[]; labels: Labels }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'staff'>('staff');
  const [link, setLink] = useState('');
  const [status, setStatus] = useState('');
  const [pending, start] = useTransition();
  const finish = (result: { error?: string }) => setStatus(result.error ? labels.error : labels.saved);
  return <div className="space-y-6">
    {isOwner && <form className="space-y-3 rounded-xl border p-4" onSubmit={(event) => { event.preventDefault();
      start(async () => { const result = await inviteMember({ storeId, email, role });
        finish(result); if (result.url) { setLink(result.url); setEmail(''); } }); }}>
      <h2 className="text-xl font-bold">{labels.invite}</h2>
      <label className="block">{labels.email}<input className="auth-input" type="email" required value={email}
        onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="block">{labels.role}<select className="auth-input" value={role}
        onChange={(event) => setRole(event.target.value as 'owner' | 'staff')}>
        <option value="staff">{labels.staff}</option><option value="owner">{labels.owner}</option></select></label>
      <button className="auth-primary" type="submit" disabled={pending}>{labels.send}</button>
      {link && <p className="break-all" role="status">{labels.link}: <a className="underline" href={link}>{link}</a></p>}
    </form>}
    <section className="space-y-3"><h2 className="text-xl font-bold">{labels.members}</h2>
      <ul className="space-y-3">{members.map((member) => <li key={member.user_id} className="space-y-2 rounded-xl border p-4">
        <p className="break-all">{member.user_id === selfId ? labels.title : member.user_id} · {member.role === 'owner' ? labels.owner : labels.staff}</p>
        {isOwner && member.user_id !== selfId && <div className="flex flex-wrap gap-2">
          <select className="auth-input" aria-label={labels.role} defaultValue={member.role} disabled={pending}
            onChange={(event) => start(async () => finish(await changeMemberRole({ storeId, userId: member.user_id, role: event.target.value })))}>
            <option value="staff">{labels.staff}</option><option value="owner">{labels.owner}</option></select>
          <button className="auth-secondary" disabled={pending} onClick={() => {
            if (window.confirm(labels.removeConfirm)) start(async () => finish(await removeMember({ storeId, userId: member.user_id })));
          }}>{labels.remove}</button></div>}
      </li>)}</ul></section>
    {isOwner && <section><h2 className="text-xl font-bold">{labels.pending}</h2>
      <ul>{invitations.map((item) => <li key={item.id} className="break-all border-b p-3">{item.email} · {item.role}</li>)}</ul></section>}
    <button className="auth-secondary" disabled={pending} onClick={() => {
      if (window.confirm(labels.leaveConfirm)) start(async () => finish(await leaveStore({ storeId })));
    }}>{labels.leave}</button>
    {status && <p role="status">{status}</p>}
  </div>;
}
