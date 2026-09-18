module.exports = [
  {
    ignores: ['node_modules/**', 'public/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next' }],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }]
    }
  }
];
