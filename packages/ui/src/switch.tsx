import { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

export type SwitchProps = SwitchPrimitive.SwitchProps;
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(props, ref) {
  return (
    <SwitchPrimitive.Root ref={ref} className="ui-switch" {...props}>
      <SwitchPrimitive.Thumb className="ui-switch-thumb" />
    </SwitchPrimitive.Root>
  );
});
