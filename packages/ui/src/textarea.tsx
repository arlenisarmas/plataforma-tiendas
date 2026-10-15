import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={clsx('ui-control', className)} {...props} />;
});
