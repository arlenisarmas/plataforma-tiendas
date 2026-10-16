'use client';

import { useState, useTransition } from 'react';
import { acceptInvitation } from '../../customers/team/actions';

export function InvitationAcceptance({ token, labels }: { token: string; labels: { accept: string; error: string } }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  return <div><button className="auth-primary" disabled={pending} onClick={() => start(async () => {
    const result = await acceptInvitation({ token });
    if (result?.error) setError(labels.error);
  })}>{labels.accept}</button>{error && <p role="alert">{error}</p>}</div>;
}
