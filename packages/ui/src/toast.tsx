import type { ReactNode } from 'react';

export function Toast({
  message,
  action,
  kind = 'success',
}: {
  message: string;
  action?: ReactNode;
  kind?: 'success' | 'error';
}) {
  return (
    <div className="ui-toast" role={kind === 'error' ? 'alert' : 'status'}>
      {message}
      {action && <div className="ui-actions">{action}</div>}
    </div>
  );
}
