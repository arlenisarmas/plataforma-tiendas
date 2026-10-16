'use server';

import { renderDraft } from '../../../lib/draft-preview';

export async function updatePreview(token: string, blocks: unknown, theme: unknown) {
  return renderDraft(token, blocks, theme);
}
