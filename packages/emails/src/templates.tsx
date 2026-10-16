import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from '@react-email/components';
import { render } from '@react-email/render';

export type EmailKind = 'orderConfirmation' | 'paymentConfirmed' | 'orderReady' | 'newOrder' | 'teamInvitation' | 'platformInvitation';
type CopyKey = EmailKind | 'orderConfirmationHeading' | 'orderConfirmationBody' | 'paymentConfirmedHeading' |
  'paymentConfirmedBody' | 'pickupHeading' | 'shippedHeading' | 'pickupBody' | 'shippedBody' |
  'newOrderHeading' | 'newOrderBody' | 'teamInvitationHeading' | 'teamInvitationBody' |
  'platformInvitationHeading' | 'platformInvitationBody' |
  'viewOrder' | 'acceptInvite' | 'footer';
export type EmailCopy = Record<CopyKey, string>;
export type EmailTemplateData = { kind: EmailKind; copy: EmailCopy; storeName: string; accentColor?: string;
  logoUrl?: string; orderNumber?: number; orderUrl?: string; paymentInstructions?: string;
  pickup?: boolean; inviteUrl?: string; recipientName?: string };

export async function renderEmail(data: EmailTemplateData): Promise<{ subject: string; html: string }> {
  const copy = data.copy;
  const subject = copy[data.kind].replace('{store}', data.storeName)
    .replace('{number}', String(data.orderNumber ?? ''));
  const heading = data.kind === 'orderConfirmation' ? copy.orderConfirmationHeading :
    data.kind === 'paymentConfirmed' ? copy.paymentConfirmedHeading :
    data.kind === 'orderReady' ? (data.pickup ? copy.pickupHeading : copy.shippedHeading) :
    data.kind === 'newOrder' ? copy.newOrderHeading :
    data.kind === 'platformInvitation' ? copy.platformInvitationHeading : copy.teamInvitationHeading;
  const body = data.kind === 'orderConfirmation' ? copy.orderConfirmationBody :
    data.kind === 'paymentConfirmed' ? copy.paymentConfirmedBody :
    data.kind === 'orderReady' ? (data.pickup ? copy.pickupBody : copy.shippedBody) :
    data.kind === 'newOrder' ? copy.newOrderBody :
    data.kind === 'platformInvitation' ? copy.platformInvitationBody : copy.teamInvitationBody;
  const color = /^#[0-9a-fA-F]{6}$/.test(data.accentColor ?? '') ? data.accentColor : '#07567a';
  const html = await render(<Html><Head /><Preview>{subject}</Preview>
    <Body style={{ backgroundColor: '#f5f7fa', fontFamily: 'Arial,sans-serif', margin: 0, padding: '24px 12px' }}>
      <Container style={{ backgroundColor: '#ffffff', borderRadius: 12, maxWidth: 560, padding: 24 }}>
        {data.logoUrl && <Img src={data.logoUrl} width="80" height="80" alt={data.storeName} />}
        <Heading style={{ color, fontSize: 26, lineHeight: '34px' }}>{data.storeName}</Heading>
        <Heading as="h2" style={{ color: '#182235', fontSize: 21, lineHeight: '30px' }}>{heading}</Heading>
        <Text style={{ color: '#243348', fontSize: 16, lineHeight: '26px' }}>
          {data.recipientName ? `${data.recipientName}, ` : ''}{body.replace('{number}', String(data.orderNumber ?? ''))}
        </Text>
        {data.kind === 'orderConfirmation' && data.paymentInstructions && <Section style={{ backgroundColor: '#f1f5f9', padding: 16 }}>
          <Text style={{ color: '#243348', fontSize: 16, whiteSpace: 'pre-wrap' }}>{data.paymentInstructions}</Text>
        </Section>}
        {data.orderUrl && <Button href={data.orderUrl} style={{ backgroundColor: color, borderRadius: 8,
          color: '#ffffff', display: 'inline-block', fontSize: 16, padding: '14px 20px' }}>{copy.viewOrder}</Button>}
        {data.inviteUrl && <Button href={data.inviteUrl} style={{ backgroundColor: color, borderRadius: 8,
          color: '#ffffff', display: 'inline-block', fontSize: 16, padding: '14px 20px' }}>{copy.acceptInvite}</Button>}
        <Text style={{ color: '#64748b', fontSize: 14 }}>{copy.footer.replace('{store}', data.storeName)}</Text>
      </Container>
    </Body></Html>);
  return { subject, html };
}
