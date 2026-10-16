import type { CheckoutInput, ManualPaymentInstructions, PaymentProvider } from './index';

export class ManualProvider implements PaymentProvider {
  readonly id = 'manual';
  constructor(private readonly instructions: ManualPaymentInstructions) {}
  async createCheckout(input: CheckoutInput) {
    void input;
    return { kind: 'instructions' as const, instructions: this.instructions };
  }
  async parseWebhook(request: Request) { void request; return null; }
}
