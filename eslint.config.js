import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    ignores: [
      'dist',
      'node_modules',
      '*.md',
    ],
  },
  {
    rules: {
      'no-console': 'off',
      'node/prefer-global/process': 'off',
    },
  },
)
