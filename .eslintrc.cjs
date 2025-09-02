module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'mysql-config.example.js'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    // Node/server files
    {
      files: [
        'server.js',
        'server-*.js',
        'server-mysql.js',
        'server-optimized.js',
      ],
      env: { node: true, browser: false },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: {
        'no-undef': 'off', // allow process, global, etc.
      },
    },
    // Tests (TS/JS)
    {
      files: [
        'tests/**/*.{ts,tsx,js,jsx}',
        'src/test/**/*.{ts,tsx,js,jsx}',
      ],
      env: { jest: true, node: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-var': 'off',
        'no-undef': 'off',
      },
    },
    // JS files use Espree with proper ECMAScript settings
    {
      files: ['**/*.js'],
      excludedFiles: ['vite.config.ts', 'jest*.cjs'],
      parser: 'espree',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  ],
};
