import { describe, expect, it } from 'vitest';
import { editorReducer, moveBlock, setField, type EditorState } from './editor-state';

describe('editor history', () => {
  it('keeps at most fifty undo steps and supports redo', () => {
    let state: EditorState = { past: [], present: [], future: [] };
    for (let i = 0; i < 55; i++) state = editorReducer(state, { type: 'change', blocks: [{ id: String(i), type: 'hero', version: 1, props: {} }] });
    expect(state.past).toHaveLength(50);
    const previous = editorReducer(state, { type: 'undo' });
    expect(previous.present[0]?.id).toBe('53');
    expect(editorReducer(previous, { type: 'redo' }).present[0]?.id).toBe('54');
  });
  it('moves and changes nested fields without mutating the original', () => {
    const blocks = [{ id: 'a', type: 'hero', version: 1, props: {} }, { id: 'b', type: 'hero', version: 1, props: {} }];
    expect(moveBlock(blocks, 0, 1).map((item) => item.id)).toEqual(['b', 'a']);
    expect(setField({ cta: { label: 'Old' } }, 'cta.label', 'New')).toEqual({ cta: { label: 'New' } });
  });
});
