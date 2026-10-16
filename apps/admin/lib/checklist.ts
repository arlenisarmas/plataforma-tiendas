export function checklistState(input: {
  hasLogo: boolean; products: number; payments: number; shipping: number; pages: number; published: boolean;
}) {
  return { logo: input.hasLogo, product: input.products > 0, payment: input.payments > 0,
    shipping: input.shipping > 0, page: input.pages > 0, publish: input.published };
}
