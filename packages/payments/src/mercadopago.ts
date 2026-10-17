import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { fromMinor } from '@plataforma/core';
import type { CheckoutInput, CheckoutResult, NormalizedPaymentEvent, PaymentProvider, PaymentStatus } from './index';

const preferenceSchema = z.object({ init_point: z.url() });
const paymentSchema = z.object({ id: z.union([z.string(), z.number()]), external_reference: z.uuid(),
  status: z.enum(['pending', 'in_process', 'approved', 'rejected', 'cancelled', 'refunded']),
  transaction_amount: z.number().finite().nonnegative(), currency_id: z.string().length(3),
  collector_id: z.union([z.string(), z.number()]) });
const notificationSchema = z.object({ type: z.string(), user_id: z.union([z.string(), z.number()]),
  data: z.object({ id: z.union([z.string(), z.number()]) }) });
const tokenSchema = z.object({ access_token: z.string().min(1), user_id: z.union([z.string(), z.number()]) });

export function createMercadoPagoAuthorizationUrl(clientId: string, redirectUri: string, state: string) {
  const url = new URL('https://auth.mercadopago.com/authorization');
  for (const [key, value] of Object.entries({ client_id: clientId, response_type: 'code', platform_id: 'mp',
    redirect_uri: redirectUri, state })) url.searchParams.set(key, value);
  return url.toString();
}

export async function exchangeMercadoPagoCode(code: string, clientId: string, clientSecret: string,
  redirectUri: string, fetcher: typeof fetch = fetch) {
  const response = await fetcher('https://api.mercadopago.com/oauth/token', { method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId,
      client_secret: clientSecret, code, redirect_uri: redirectUri }) });
  if (!response.ok) throw new Error('Mercado Pago authorization failed');
  return tokenSchema.parse(await response.json());
}

export function verifyMercadoPagoSignature(request: Request, secret: string, dataId: string): boolean {
  const signature = request.headers.get('x-signature')?.split(',').map((part) => part.trim()) ?? [];
  const timestamp = signature.find((part) => part.startsWith('ts='))?.slice(3);
  const digest = signature.find((part) => part.startsWith('v1='))?.slice(3);
  const requestId = request.headers.get('x-request-id');
  if (!timestamp || !/^\d{10,13}$/.test(timestamp) || !digest || !/^[a-f0-9]{64}$/i.test(digest) || !requestId) return false;
  const expected = createHmac('sha256', secret).update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`).digest();
  const supplied = Buffer.from(digest, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function readMercadoPagoNotification(request: Request) {
  return notificationSchema.safeParse(await request.json());
}

const statuses: Record<z.infer<typeof paymentSchema>['status'], PaymentStatus> = {
  pending: 'pending', in_process: 'in_review', approved: 'approved', rejected: 'rejected',
  cancelled: 'cancelled', refunded: 'refunded',
};

export class MercadoPagoProvider implements PaymentProvider {
  readonly id = 'mercadopago';
  constructor(private readonly accessToken: string, private readonly webhookSecret: string,
    private readonly fetcher: typeof fetch = fetch) {}

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (input.total <= 0n || input.total > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Invalid amount');
    const unitPrice = Number(fromMinor(input.total, input.currency, 'en-US').replaceAll(',', ''));
    const response = await this.fetcher('https://api.mercadopago.com/checkout/preferences', { method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json',
        'X-Idempotency-Key': input.paymentId },
      body: JSON.stringify({ items: [{ title: input.description, quantity: 1, currency_id: input.currency,
        unit_price: unitPrice }], external_reference: input.paymentId, notification_url: input.notificationUrl,
        back_urls: { success: input.returnUrl, failure: input.returnUrl, pending: input.returnUrl } }) });
    if (!response.ok) throw new Error('Mercado Pago preference failed');
    return { kind: 'redirect', url: preferenceSchema.parse(await response.json()).init_point };
  }

  async parseWebhook(request: Request): Promise<NormalizedPaymentEvent | null> {
    const notification = await readMercadoPagoNotification(request);
    if (!notification.success || notification.data.type !== 'payment') return null;
    const dataId = String(notification.data.data.id);
    const queryId = new URL(request.url).searchParams.get('data.id');
    if (queryId && queryId !== dataId) throw new Error('Invalid webhook payment ID');
    if (!verifyMercadoPagoSignature(request, this.webhookSecret, dataId)) throw new Error('Invalid webhook signature');
    const response = await this.fetcher(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } });
    if (!response.ok) throw new Error('Mercado Pago payment lookup failed');
    const payment = paymentSchema.parse(await response.json());
    return { providerEventId: `${dataId}:${payment.status}`, providerPaymentId: String(payment.id), paymentId: payment.external_reference,
      status: statuses[payment.status], amount: payment.transaction_amount, currency: payment.currency_id,
      collectorId: String(payment.collector_id) };
  }
}
