// ESLint configuration for Synchronous Generator Simulator
// Prevents bugs like #1 (none vs 'none')

export default [
  {
    files: ['src/**/*.js', 'tools/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // Prevent undefined variables (catches 'none' vs "none")
      'no-undef': 'error',

      // Prevent unused variables
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Code quality
      'no-var': 'error',
      'prefer-const': 'warn',
      'no-console': 'off', // Allow console for debugging

      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // ES6+
      'arrow-spacing': 'warn',
      'no-duplicate-imports': 'error',

      // Catch common mistakes
      'no-cond-assign': 'error',
      'no-constant-condition': 'warn',
      'no-unreachable': 'error',
    },
  },
  {
    files: ['tools/**/*.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        global: 'readonly',
      },
    },
  },
];
