module.exports = {
  ignorePatterns: ['.eslintrc.js',  'dist', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
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
    '@typescript-eslint/no-var-requires': 'off'
  }
};
