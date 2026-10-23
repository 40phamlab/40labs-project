import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: './ProductActionCard',
              message: 'ProductActionCard has been removed. Use ProductCard or DealRow instead.',
            },
            {
              name: './SupplierDealsTab',
              message: 'SupplierDealsTab has been removed. Use DealsTab instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/dev/**', '**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
