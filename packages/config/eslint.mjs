import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import next from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const packages = ['core', 'db', 'ui', 'blocks', 'payments', 'i18n', 'emails', 'config'];
const policy = (from, to, kind) => ({
  from: { element: { type: from } },
  allow: {
    to: {
      element: { type: to, fileInternalPath: 'src/index.ts' },
    },
    ...(kind ? { dependency: { kind } } : {}),
  },
});
const config = [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next.map((entry) => ({ ...entry, files: ['apps/**/*.{ts,tsx}'] })),
  {
    settings: { next: { rootDir: ['apps/admin', 'apps/storefront'] }, react: { version: '19.3' } },
  },
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/root-path': root,
      'boundaries/elements': [
        { type: 'app', pattern: 'apps/*' },
        ...packages.map((name) => ({ type: name, pattern: `packages/${name}` })),
      ],
      'import/resolver': { typescript: { project: `${root}/tsconfig.eslint.json` } },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            policy(
              'app',
              packages.filter((name) => name !== 'config'),
            ),
            policy('blocks', ['ui', 'core', 'i18n']),
            policy('payments', ['core', 'db']),
            policy('db', ['core'], 'type'),
          ],
        },
      ],
      'boundaries/no-unknown-dependencies': 'error',
      'boundaries/no-unknown-files': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@plataforma/*/src/**',
                '**/packages/**',
                ...packages.map((name) => `../**/${name}/**`),
              ],
              message: 'Use the public package name.',
            },
          ],
        },
      ],
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true }],
    },
  },
  prettier,
];
export default config;
