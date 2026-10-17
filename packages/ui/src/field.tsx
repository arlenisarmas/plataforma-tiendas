import { cloneElement, useId, type ReactElement } from 'react';

export type FieldProps = {
  label: string;
  help?: string;
  error?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;
};

export function Field({ label, help, error, children }: FieldProps) {
  const id = useId();
  const inputId = children.props.id ?? `${id}-input`;
  const describedBy = [
    children.props['aria-describedby'],
    help && `${id}-help`,
    error && `${id}-error`,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="ui-field">
      <label htmlFor={inputId}>{label}</label>
      {help && (
        <small className="ui-help" id={`${id}-help`}>
          {help}
        </small>
      )}
      {cloneElement(children, {
        id: inputId,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': true } : {}),
      })}
      {error && (
        <small className="ui-error" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}
