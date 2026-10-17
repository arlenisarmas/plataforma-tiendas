import type { z } from 'zod';
import type { faqSchema } from './schema';
export function Faq({ props, variant }: { props: z.infer<typeof faqSchema>; variant: string }) {
  return <section className={`block-faq block-faq--${variant}`} data-variant={variant}>
    {props.title && <h2>{props.title}</h2>}
    <div>{props.items.map((item, index) => <details key={index} role="group" aria-label={item.question}>
      <summary>{item.question}</summary><p>{item.answer}</p>
    </details>)}</div>
  </section>;
}
