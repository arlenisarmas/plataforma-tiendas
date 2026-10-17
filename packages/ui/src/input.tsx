import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={clsx('ui-control', className)} {...props} />;
  },
);
