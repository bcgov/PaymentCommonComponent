module.exports = {
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    'import',
    'prettier',
    'unused-imports'
  ],
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  root: false,
  env: {
    node: true,
    jest: true
  },
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { vars: 'all', args: 'after-used', ignoreRestSiblings: false }
    ],
    '@typescript-eslint/no-var-requires': 'off',

    'import/order': [
      1,
      {
        groups: [
          'external',
          'builtin',
          'internal',
          'sibling',
          'parent',
          'index'
        ],
        pathGroups: [
          {
            pattern: '@/**',
            group: 'external'
          },
          {
            pattern: './**',
            group: 'internal'
          },
          {
            pattern: '../**',
            group: 'internal'
          }
        ],
        pathGroupsExcludedImportTypes: ['internal'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_'
      }
    ]
  }
};
