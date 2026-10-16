import type { z } from 'zod';
import type { StoreContext } from '../types';
import type { gallerySchema } from './schema';
export function Gallery({ props, variant, ctx }: { props: z.infer<typeof gallerySchema>; variant: string; ctx: StoreContext }) {
  return <section className={`block-gallery block-gallery--${variant}`} data-variant={variant}>
    {props.title && <h2>{props.title}</h2>}
    <div>{props.images.map((image, index) => { const src = ctx.assetUrl(image.assetId);
      return src && <img key={`${image.assetId}-${index}`} src={src} alt={image.alt} loading="lazy" decoding="async" />; })}</div>
  </section>;
}
