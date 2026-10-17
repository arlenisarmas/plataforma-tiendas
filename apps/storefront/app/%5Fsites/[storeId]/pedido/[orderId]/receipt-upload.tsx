'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@plataforma/db';

type Labels = { receipt: string; upload: string; uploadError: string; uploadDone: string };

export function ReceiptUpload({ paymentId, orderToken, labels }: { paymentId: string; orderToken: string; labels: Labels }) {
  const router = useRouter();
  const [file, setFile] = useState<File>();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async () => {
    if (!file || file.size > 5_242_880 || file.size === 0) { setMessage(labels.uploadError); return; }
    setPending(true); setMessage('');
    try {
      const start = await fetch('/api/payments/manual-receipt', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, orderToken, mimeType: file.type, size: file.size }) });
      if (!start.ok) throw new Error('signing failed');
      const { path, token } = await start.json() as { path: string; token: string };
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error('storage unavailable');
      const uploaded = await createBrowserClient(url, key).storage.from('payment-receipts')
        .uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (uploaded.error) throw new Error('upload failed');
      const finish = await fetch('/api/payments/manual-receipt', { method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId, orderToken, path }) });
      if (!finish.ok) throw new Error('validation failed');
      setMessage(labels.uploadDone); router.refresh();
    } catch { setMessage(labels.uploadError); }
    finally { setPending(false); }
  };
  return <div className="space-y-3"><label className="block font-semibold">{labels.receipt}
    <input className="mt-1 block min-h-11 w-full" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
      onChange={(event) => setFile(event.target.files?.[0])} /></label>
    <button type="button" disabled={!file || pending} onClick={() => void submit()}
      className="min-h-11 rounded bg-black px-5 text-white disabled:opacity-50">{labels.upload}</button>
    {message && <p role="status">{message}</p>}
  </div>;
}
