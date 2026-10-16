'use client';

import { useState, type ReactNode } from 'react';
import { Button } from './button';

export type WizardStep = { title: string; fields: ReactNode[] };
export type WizardLabels = { back: string; next: string; finish: string; progress: (step: number, total: number) => string };

export function StepWizard({ steps, onComplete, labels, canAdvance, busy = false }: {
  steps: WizardStep[]; onComplete: () => void; labels: WizardLabels;
  canAdvance?: (index: number) => boolean; busy?: boolean;
}) {
  const [index, setIndex] = useState(0);
  if (steps.length === 0 || steps.some((step) => step.fields.length > 3))
    throw new Error('Each step must have at most three fields.');
  const step = steps[index];
  if (!step) return null;
  return (
    <section aria-label={labels.progress(index + 1, steps.length)}>
      <p aria-live="polite">
        {labels.progress(index + 1, steps.length)}
      </p>
      <progress
        className="ui-progress"
        value={index + 1}
        max={steps.length}
        aria-label={labels.progress(index + 1, steps.length)}
      />
      <h2>{step.title}</h2>
      <div className="ui-field">
        {step.fields.map((field, fieldIndex) => (
          <div key={fieldIndex}>{field}</div>
        ))}
      </div>
      <div className="ui-actions">
        {index > 0 && (
          <Button variant="secondary" onClick={() => setIndex(index - 1)}>
            {labels.back}
          </Button>
        )}
        <Button disabled={busy || (canAdvance ? !canAdvance(index) : false)} onClick={() => (index === steps.length - 1 ? onComplete() : setIndex(index + 1))}>
          {index === steps.length - 1 ? labels.finish : labels.next}
        </Button>
      </div>
    </section>
  );
}
