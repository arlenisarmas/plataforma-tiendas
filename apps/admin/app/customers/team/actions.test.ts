import { beforeEach, describe, expect, it, vi } from 'vitest';

const { panelContext, renderEmail, sendWithRetry } = vi.hoisted(() => ({
  panelContext: vi.fn(), renderEmail: vi.fn(), sendWithRetry: vi.fn(),
}));
vi.mock('../../../lib/panel-data', () => ({ panelContext }));
vi.mock('../../../lib/locale', () => ({ adminLocale: async () => 'es-AR' }));
vi.mock('@plataforma/emails', () => ({ createEmailSender: () => ({ send: vi.fn() }), renderEmail, sendWithRetry }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

import { inviteMember, removeMember } from './actions';

const storeId = 'a0000000-0000-4000-8000-000000000001';
const userId = 'b0000000-0000-4000-8000-000000000001';
const membership = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() };
const client = { from: vi.fn().mockReturnValue(membership) };

describe('team actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    panelContext.mockResolvedValue({ selected: { id: storeId, name: 'Demo' }, userId, client });
    membership.single.mockResolvedValue({ data: { role: 'staff' } });
  });
  it('never lets staff invite a member', async () => {
    expect(await inviteMember({ storeId, email: 'new@example.test', role: 'staff' })).toEqual({ error: 'permission' });
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(renderEmail).not.toHaveBeenCalled();
  });
  it('never lets an owner remove their own membership through the owner action', async () => {
    membership.single.mockResolvedValue({ data: { role: 'owner' } });
    expect(await removeMember({ storeId, userId })).toEqual({ error: 'permission' });
  });
});
