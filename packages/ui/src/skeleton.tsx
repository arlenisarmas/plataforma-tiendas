import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={clsx('ui-skeleton', className)} {...props} />;
}
