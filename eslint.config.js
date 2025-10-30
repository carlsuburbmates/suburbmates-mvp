import { defineConfig } from 'eslint/config'
import { FlatCompat } from '@eslint/eslintrc'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier/flat'
import globals from 'globals'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default defineConfig([
  { ignores: ['.next/**', 'node_modules/**', 'dist/**', 'public/**'] },
  ...compat.extends('next/core-web-vitals'),
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
])
