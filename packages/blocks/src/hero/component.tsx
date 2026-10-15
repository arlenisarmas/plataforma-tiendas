import type { z } from 'zod';
import type { StoreContext } from '../types';
import type { heroSchema } from './schema';

type Props = { props: z.infer<typeof heroSchema>; variant: string; ctx: StoreContext };

export function Hero({ props, variant, ctx }: Props) {
  const imageUrl = props.image && ctx.assetUrl(props.image.assetId);
  const link =
    props.cta?.link.kind === 'url'
      ? props.cta.link.href
      : props.cta?.link.categoryId
        ? `/categoria/${props.cta.link.categoryId}`
        : '/productos';
  return (
    <section className={`block-hero block-hero--${variant}`} data-variant={variant}>
      <div className="block-hero__copy" style={{ textAlign: props.align }}>
        <h1>{props.title}</h1>
        {props.subtitle && <p>{props.subtitle}</p>}
        {props.cta && (
          <a className="block-cta" href={link}>
            {props.cta.label}
          </a>
        )}
      </div>
      {imageUrl && variant !== 'minimal' && <img src={imageUrl} alt={props.image?.alt ?? ''} loading="lazy" />}
    </section>
  );
}
