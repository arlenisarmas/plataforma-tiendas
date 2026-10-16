import type { CurrencyCode } from '@plataforma/core';

export type PaymentStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
export type CheckoutInput = { paymentId: string; orderId: string; currency: CurrencyCode; total: bigint;
  description: string; returnUrl: string; notificationUrl: string };
export type ManualPaymentInstructions = { method: string; details: Record<string, string>; receiptRequired: boolean };
export type CheckoutResult = { kind: 'redirect'; url: string } |
  { kind: 'instructions'; instructions: ManualPaymentInstructions };
export type NormalizedPaymentEvent = { providerEventId: string; paymentId: string; providerPaymentId: string;
  status: PaymentStatus; amount: number; currency: string; collectorId: string };

export interface PaymentProvider {
  readonly id: 'mercadopago' | 'manual' | 'stripe' | 'paypal';
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  parseWebhook(request: Request): Promise<NormalizedPaymentEvent | null>;
}

export { ManualProvider } from './manual';
export { MercadoPagoProvider, createMercadoPagoAuthorizationUrl, exchangeMercadoPagoCode,
  readMercadoPagoNotification, verifyMercadoPagoSignature } from './mercadopago';
