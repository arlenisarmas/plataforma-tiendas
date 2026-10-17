'use client';

import { useState, type ReactNode } from 'react';
import { Button } from './button';

export type WizardStep = { title: string; fields: ReactNode[]; help?: string };
export type WizardLabels = { back: string; next: string; finish: string; progress: (step: number, total: number) => string };

/**
 * Asistente guiado: una pregunta grande por paso, barra de progreso por pasos y,
 * opcionalmente, una vista previa al costado (debajo en celular).
 */
export function StepWizard({ steps, onComplete, labels, canAdvance, busy = false, aside, onStepChange }: {
  steps: WizardStep[]; onComplete: () => void; labels: WizardLabels;
  canAdvance?: (index: number) => boolean; busy?: boolean;
  aside?: ReactNode | ((index: number) => ReactNode); onStepChange?: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  if (steps.length === 0 || steps.some((step) => step.fields.length > 3))
    throw new Error('Each step must have at most three fields.');
  const step = steps[index];
  if (!step) return null;
  const go = (next: number) => { setIndex(next); onStepChange?.(next); };
  const progress = labels.progress(index + 1, steps.length);
  const side = typeof aside === 'function' ? aside(index) : aside;
  return (
    <section aria-label={progress} className="ui-wizard">
      <div className="ui-wizard-top">
        <p aria-live="polite" className="ui-wizard-count">{progress}</p>
        <progress className="ui-progress ui-visually-hidden" value={index + 1} max={steps.length} aria-label={progress} />
        <div className="ui-wizard-bars" aria-hidden="true">
          {steps.map((item, at) => <span key={item.title} data-done={at <= index ? 'true' : 'false'} />)}
        </div>
      </div>
      <div className="ui-wizard-body">
        <div className="ui-wizard-main">
          <h2 className="ui-wizard-title">{step.title}</h2>
          {step.help && <p className="ui-help ui-wizard-help">{step.help}</p>}
          <div className="ui-field ui-wizard-fields">
            {step.fields.map((field, fieldIndex) => (
              <div key={fieldIndex}>{field}</div>
            ))}
          </div>
          <div className="ui-actions">
            {index > 0 && (
              <Button variant="secondary" onClick={() => go(index - 1)}>
                {labels.back}
              </Button>
            )}
            <Button className="ui-wizard-next" disabled={busy || (canAdvance ? !canAdvance(index) : false)}
              onClick={() => (index === steps.length - 1 ? onComplete() : go(index + 1))}>
              {index === steps.length - 1 ? labels.finish : labels.next}
            </Button>
          </div>
        </div>
        {side && <aside className="ui-wizard-aside">{side}</aside>}
      </div>
    </section>
  );
}
