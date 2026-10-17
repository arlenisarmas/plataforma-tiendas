'use client';

import type { ReactNode } from 'react';

/** Grupo de opciones grandes con dibujo (radio accesible), usado en todos los pasos del armado. */
export function ChoiceGroup<T extends string>({ legend, name, value, options, onChange, columns = 3 }: {
  legend: string; name: string; value: T; columns?: 2 | 3 | 5;
  options: { value: T; label: string; picture: ReactNode }[]; onChange: (value: T) => void;
}) {
  const grid = { 2: 'grid-cols-2', 3: 'grid-cols-3', 5: 'grid-cols-3 sm:grid-cols-5' }[columns];
  return <fieldset className="m-0 border-0 p-0">
    <legend className="mb-3 font-semibold">{legend}</legend>
    <div className={`grid ${grid} gap-3`}>{options.map((option) =>
      <label key={option.value} className="flex min-h-11 cursor-pointer flex-col gap-2 rounded-xl border-2 border-[#2a2f3c] bg-[#0e1016] p-2.5 has-[:checked]:border-[#8c90ff] has-[:checked]:bg-[#232850] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#afb4ff]">
        <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="sr-only" />
        {option.picture}
        <span className="text-center text-sm font-semibold">{option.label}</span>
      </label>)}</div>
  </fieldset>;
}

/** Mensaje de resultado al guardar. */
export function SaveMessage({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return <p role={message.ok ? 'status' : 'alert'} className={`m-0 rounded-xl p-3 ${message.ok ? 'bg-[#173b2e] text-[#7ee2b3]' : 'bg-[#3b1a20] text-[#ff9aa5]'}`}>{message.text}</p>;
}
