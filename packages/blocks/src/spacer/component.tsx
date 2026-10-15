export function Spacer({ variant }: { variant: string }) {
  return <div className={`block-spacer block-spacer--${variant}`} data-variant={variant} aria-hidden="true" />;
}
