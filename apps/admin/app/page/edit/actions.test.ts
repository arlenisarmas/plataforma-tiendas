import { describe, expect, it, vi } from 'vitest';

const { panelContext } = vi.hoisted(() => ({ panelContext: vi.fn() }));
vi.mock('../../../lib/panel-data', () => ({ panelContext }));
import { saveDraftBlocks } from './actions';

const storeId = 'a0000000-0000-4000-8000-000000000001';
const pageId = 'a0000000-0000-4000-8000-000000000002';

describe('draft saving', () => {
  it('rejects unknown block types before touching the database', async () => {
    expect(await saveDraftBlocks({ storeId, pageId, blocks: [{ id: 'b1', type: 'missing', version: 1, props: {} }] }))
      .toEqual({ error: 'invalid' });
    expect(panelContext).not.toHaveBeenCalled();
  });
  it('checks membership in the selected store', async () => {
    panelContext.mockResolvedValueOnce({ selected: { id: pageId } });
    expect(await saveDraftBlocks({ storeId, pageId, blocks: [] })).toEqual({ error: 'permission' });
  });
});
