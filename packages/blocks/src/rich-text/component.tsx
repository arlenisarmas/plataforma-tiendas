import type { ReactNode } from 'react';
import type { z } from 'zod';
import type { richTextSchema } from './schema';

function inline(text: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
      const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
      return link ? (
        <a key={index} href={link[2]} rel="noopener noreferrer">
          {link[1]}
        </a>
      ) : (
        part
      );
    });
}

export function RichText({ props, variant }: { props: z.infer<typeof richTextSchema>; variant: string }) {
  const content: ReactNode[] = [];
  let list: ReactNode[] = [];
  const flushList = () => {
    if (list.length) content.push(<ul key={`list-${content.length}`}>{list}</ul>);
    list = [];
  };
  props.body.split(/\r?\n/).forEach((line, index) => {
    const item = /^\s*[-*]\s+(.+)$/.exec(line);
    if (item) {
      list.push(<li key={index}>{inline(item[1] ?? '')}</li>);
      return;
    }
    flushList();
    if (line.trim()) content.push(<p key={index}>{inline(line.trim())}</p>);
  });
  flushList();
  return (
    <section className={`block-rich-text block-rich-text--${variant}`} data-variant={variant}>
      {props.title && <h2>{props.title}</h2>}
      {content}
    </section>
  );
}
