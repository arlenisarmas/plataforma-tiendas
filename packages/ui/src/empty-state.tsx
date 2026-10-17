import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
  illustration,
}: {
  title: string;
  description: string;
  action: ReactNode;
  illustration?: ReactNode;
}) {
  return (
    <section className="ui-empty" aria-label={title}>
      {illustration ?? <span aria-hidden="true">◇</span>}
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
