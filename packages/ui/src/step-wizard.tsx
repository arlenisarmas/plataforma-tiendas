import { useState, type ReactNode } from 'react';
import { Button } from './button';

export type WizardStep = { title: string; fields: ReactNode[] };

export function StepWizard({ steps, onComplete }: { steps: WizardStep[]; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  if (steps.length === 0 || steps.some((step) => step.fields.length > 3))
    throw new Error('Cada paso debe tener entre 0 y 3 campos.');
  const step = steps[index];
  if (!step) return null;
  return (
    <section aria-label="Pasos para completar la tarea">
      <p aria-live="polite">
        Paso {index + 1} de {steps.length}
      </p>
      <progress
        className="ui-progress"
        value={index + 1}
        max={steps.length}
        aria-label="Progreso"
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
            Atrás
          </Button>
        )}
        <Button onClick={() => (index === steps.length - 1 ? onComplete() : setIndex(index + 1))}>
          {index === steps.length - 1 ? 'Terminar' : 'Siguiente'}
        </Button>
      </div>
    </section>
  );
}
