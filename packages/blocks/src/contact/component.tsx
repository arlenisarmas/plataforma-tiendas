import type { z } from 'zod';
import type { contactSchema, contactDataSchema } from './schema';
type Contact = z.infer<typeof contactDataSchema> & { labels: { whatsapp: string; phone: string; email: string; address: string; hours: string } };
export function Contact({ props, variant, data }: { props: z.infer<typeof contactSchema>; variant: string; data: unknown }) {
  const contact = data as Contact | null;
  if (!contact) return null;
  const phone = contact.phone?.replace(/[^+\d]/g, '');
  const whatsapp = contact.whatsapp?.replace(/\D/g, '');
  const map = props.mapUrl ?? (contact.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}` : undefined);
  return <section className={`block-contact block-contact--${variant}`} data-variant={variant}>
    {props.title && <h2>{props.title}</h2>}
    <div>
      {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(props.whatsappMessage)}`}>{contact.labels.whatsapp}</a>}
      {phone && <a href={`tel:${phone}`}>{contact.labels.phone}: {contact.phone}</a>}
      {contact.email && <a href={`mailto:${contact.email}`}>{contact.labels.email}: {contact.email}</a>}
      {map && <a href={map} rel="noopener noreferrer">{contact.labels.address}: {contact.address}</a>}
      {contact.hours && <p>{contact.labels.hours}: {contact.hours}</p>}
      {contact.social?.map((item) => <a key={item.url} href={item.url} rel="noopener noreferrer">{item.label}</a>)}
    </div>
    {variant === 'map' && contact.address && <iframe title={contact.labels.address} loading="lazy" referrerPolicy="no-referrer"
      src={`https://maps.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed`} />}
  </section>;
}
