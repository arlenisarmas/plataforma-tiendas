import { expect, it, vi } from 'vitest';
import { renderPage } from './render-page';
import { createTheme } from './theme';

it('omits a hidden section while preserving its draft data', async () => {
  const block = { id: 'hero-1', type: 'hero', version: 1, variant: 'split', hidden: true,
    props: { title: 'My shop', align: 'left' } };
  const onError = vi.fn();
  const nodes = await renderPage([block], { storeId: 'store', locale: 'en', assetUrl: () => undefined },
    createTheme(), { onError });
  expect(nodes).toEqual([]);
  expect(block.props.title).toBe('My shop');
  expect(onError).not.toHaveBeenCalled();
});
