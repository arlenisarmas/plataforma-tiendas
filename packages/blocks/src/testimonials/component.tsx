import type { z } from 'zod';
import type { testimonialsSchema } from './schema';
export function Testimonials({ props, variant }: { props: z.infer<typeof testimonialsSchema>; variant: string }) {
  return <section className={`block-testimonials block-testimonials--${variant}`} data-variant={variant}>
    {props.title && <h2>{props.title}</h2>}
    <div>{props.items.map((item, index) => <blockquote key={index}><p>{item.quote}</p><footer>— {item.author}</footer></blockquote>)}</div>
  </section>;
}
