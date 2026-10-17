export type PublishChecks = { home: boolean; product: boolean; payment: boolean; shipping: boolean };

export function canPublish(checks: PublishChecks): boolean {
  return Object.values(checks).every(Boolean);
}
