import type { BlockInstance } from '@plataforma/blocks';

export type EditorBlock = BlockInstance & { hidden?: boolean };
export type EditorState = { past: EditorBlock[][]; present: EditorBlock[]; future: EditorBlock[][] };
export type EditorAction = { type: 'change'; blocks: EditorBlock[] } | { type: 'undo' } | { type: 'redo' };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'undo') {
    const previous = state.past.at(-1);
    return previous ? { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future].slice(0, 50) } : state;
  }
  if (action.type === 'redo') {
    const next = state.future[0];
    return next ? { past: [...state.past, state.present].slice(-50), present: next, future: state.future.slice(1) } : state;
  }
  if (JSON.stringify(action.blocks) === JSON.stringify(state.present)) return state;
  return { past: [...state.past, state.present].slice(-50), present: action.blocks, future: [] };
}

export function moveBlock(blocks: EditorBlock[], from: number, to: number): EditorBlock[] {
  if (from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return blocks;
  const next = [...blocks];
  const [item] = next.splice(from, 1);
  if (item) next.splice(to, 0, item);
  return next;
}

export function setField(value: unknown, path: string, next: unknown): Record<string, unknown> {
  const keys = path.split('.');
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const [first, ...rest] = keys;
  if (!first) return source;
  return { ...source, [first]: rest.length ? setField(source[first], rest.join('.'), next) : next };
}
