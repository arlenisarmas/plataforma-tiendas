import type { z } from 'zod';
import type { StoreContext } from '../types';
import type { imageWithTextSchema } from './schema';
export function ImageWithText({ props, variant, ctx }: { props: z.infer<typeof imageWithTextSchema>; variant: string; ctx: StoreContext }) {
  const src = ctx.assetUrl(props.image.assetId);
  return <section className={`block-image-text block-image-text--${variant}`} data-variant={variant}>
    {src && <img src={src} alt={props.image.alt} loading="lazy" decoding="async" />}
    <div><h2>{props.title}</h2><p>{props.body}</p>{props.button && <a className="block-cta" href={props.button.href}>{props.button.label}</a>}</div>
  </section>;
}
