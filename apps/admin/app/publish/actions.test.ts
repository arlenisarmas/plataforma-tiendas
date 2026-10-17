import { beforeEach, describe, expect, it, vi } from 'vitest';

const { panelContext, publishChecks, findDomain, createDomain } = vi.hoisted(() => ({
  panelContext: vi.fn(), publishChecks: vi.fn(), findDomain: vi.fn(), createDomain: vi.fn(),
}));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock('../../lib/panel-data', () => ({ panelContext }));
vi.mock('../../lib/publish-data', () => ({ publishChecks }));
vi.mock('../../lib/domain-admin', () => ({ findDomain, createDomain }));

import { publishStore } from './actions';

const storeId = 'a0000000-0000-4000-8000-000000000001';
function form() { const data = new FormData(); data.set('storeId', storeId); return data; }

describe('store publication', () => {
  const membership = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn() };
  const client = { from: vi.fn().mockReturnValue(membership), rpc: vi.fn() };
  beforeEach(() => {
    vi.clearAllMocks();
    panelContext.mockResolvedValue({ selected: { id: storeId, slug: 'test-store' }, userId: 'owner-id', client });
    membership.maybeSingle.mockResolvedValue({ data: { role: 'owner' }, error: null });
    publishChecks.mockResolvedValue({ home: true, product: true, payment: true, shipping: true });
  });
  it('rejects a staff member before the privileged domain operation', async () => {
    membership.maybeSingle.mockResolvedValue({ data: { role: 'staff' }, error: null });
    await expect(publishStore(form())).rejects.toThrow(`redirect:/publish?store=${storeId}&result=permission`);
    expect(findDomain).not.toHaveBeenCalled();
    expect(createDomain).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('requires every readiness check before registering a domain', async () => {
    publishChecks.mockResolvedValue({ home: true, product: true, payment: false, shipping: true });
    await expect(publishStore(form())).rejects.toThrow(`redirect:/publish?store=${storeId}&result=missing`);
    expect(findDomain).not.toHaveBeenCalled();
    expect(createDomain).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
  });
});
