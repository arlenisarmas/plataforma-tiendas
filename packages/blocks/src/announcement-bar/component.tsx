import type { z } from 'zod';
import type { announcementBarSchema } from './schema';
export function AnnouncementBar({ props, variant }: { props: z.infer<typeof announcementBarSchema>; variant: string }) {
  return <aside className={`block-announcement block-announcement--${variant}`} data-variant={variant}>
    <p>{props.text}</p>{props.button && <a href={props.button.href}>{props.button.label}</a>}
  </aside>;
}
