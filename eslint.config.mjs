// @ts-check
/**
 * Configuración de ESLint para todo el monorepo (flat config, ESLint 10).
 *
 *   pnpm lint        → revisa todo
 *   pnpm lint:fix    → corrige lo que sea automático
 *
 * El tipado lo valida `pnpm typecheck` (tsc); aquí se revisan errores de lógica y buenas prácticas.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/android/**',
      '**/ios/**',
      'docs/**',
      '**/*.tsbuildinfo',
    ],
  },

  // Base para todo el código
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Variables sin usar: error, salvo las que empiezan con _ (parámetros obligatorios de Express, etc.)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      // Tipado estricto: `any` prohibido (usar `unknown` + validación, o tipos concretos).
      // Excepción puntual: comentario eslint-disable con justificación.
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },

  // Archivos de configuración en CommonJS (metro, babel, tailwind, postcss)
  {
    files: ['**/*.config.js', '**/*.config.cjs', '**/babel.config.js', '**/metro.config.js'],
    languageOptions: { globals: { ...globals.node }, sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['apps/admin/*.config.js'],
    languageOptions: { sourceType: 'module' },
  },

  // Backend y paquetes compartidos: Node
  {
    files: ['apps/backend/**/*.ts', 'packages/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Tests: se permite `any` para construir respuestas y datos de prueba
  {
    files: ['**/*.test.ts', 'apps/backend/src/test/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  // Panel admin: React en el navegador
  {
    files: ['apps/admin/src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // App móvil: React Native
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, __DEV__: 'readonly' } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      // RN carga imágenes con require('…png')
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
