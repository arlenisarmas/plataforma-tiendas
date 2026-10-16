import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { callRpc, type RpcArgs, type RpcReturn } from './rpc';

const args: RpcArgs<'create_store'> = {
  p_name: 'Mi tienda', p_slug: 'mi-tienda', p_country_code: 'AR', p_currency: 'ARS',
};
const createdId: RpcReturn<'create_store'> = '188366af-c0e1-4919-93a1-440d58397169';

describe('callRpc', () => {
  it('passes typed arguments and returns the typed result', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: createdId, error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;
    expect(await callRpc(client, 'create_store', args)).toEqual({ ok: true, value: createdId });
    expect(rpc).toHaveBeenCalledWith('create_store', args);
  });

  it('maps a business error without leaking the database message', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'DIRECCION_EN_USO: mi-tienda' } }) } as unknown as SupabaseClient<Database>;
    expect(await callRpc(client, 'create_store', args)).toEqual({ ok: false, error: 'DIRECCION_EN_USO' });
  });

  it('does not disguise an infrastructure failure as a business error', async () => {
    const error = { message: 'network unavailable' };
    const client = { rpc: vi.fn().mockResolvedValue({ data: null, error }) } as unknown as SupabaseClient<Database>;
    await expect(callRpc(client, 'create_store', args)).rejects.toBe(error);
  });
});
