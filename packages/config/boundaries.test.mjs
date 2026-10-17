import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import { expect, test } from 'vitest';

const cwd = fileURLToPath(new URL('../../', import.meta.url));
const eslint = new ESLint({ cwd });
const errors = async (code, filePath) => {
  const results = await eslint.lintText(code, { filePath });
  return results.flatMap((result) => result.messages.filter((message) => message.severity === 2));
};

test.each([
  ["import '@plataforma/db';", 'packages/core/src/probe.ts'],
  ["import '../../../apps/admin/app/page';", 'packages/core/src/probe.ts'],
  ["import '@plataforma/admin';", 'packages/ui/src/probe.ts'],
  ["import '@plataforma/core';", 'packages/db/src/probe.ts'],
  ["import '../../i18n/src/index';", 'packages/blocks/src/probe.ts'],
])('rejects forbidden dependency: %s in %s', async (code, filePath) => {
  expect(await errors(code, filePath)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ruleId: expect.stringMatching(/boundaries|no-restricted-imports/),
      }),
    ]),
  );
});

test.each([
  ["import '@plataforma/i18n';", 'apps/admin/app/probe.ts'],
  ["import '@plataforma/core';", 'packages/blocks/src/probe.ts'],
  ["import type {} from '@plataforma/core';", 'packages/db/src/probe.ts'],
])('allows public dependency: %s in %s', async (code, filePath) => {
  expect(await errors(code, filePath)).toEqual([]);
});
