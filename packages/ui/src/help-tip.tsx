import { useId, useState } from 'react';

export function HelpTip({ text, label = 'Ayuda' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span>
      <button
        type="button"
        className="ui-tip"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        ?
      </button>
      <span id={id} hidden={!open} className="ui-help">
        {text}
      </span>
    </span>
  );
}
