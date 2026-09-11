import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-*/**',
      'release/**',
      'release*/**',
      'out-*/**',
      'package-release/**',
      'installer/**',
      'build-dist/**',
      'node_modules/**',
      'output_*/**',
      'temp_*/**',
      'scripts/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**', '**/main/**', '**/preload/**', '**/workers/**', 'exceljs', 'electron', 'node:*'],
              message: 'Renderer không được truy cập tầng Node/Electron/Worker.',
            },
          ],
        },
      ],
    },
  },
)
