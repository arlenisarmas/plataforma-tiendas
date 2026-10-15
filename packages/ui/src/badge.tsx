import type { HTMLAttributes } from 'react';

export function Badge({
  status,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { status: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className="ui-badge" data-status={status} {...props} />;
}
