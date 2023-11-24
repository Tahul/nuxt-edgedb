import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    ignores: [
      'dist',
      'node_modules',
      '*.md',
      'package.json',
    ],
  },
  {
    rules: {
      'no-console': 'off',
      'node/prefer-global/process': 'off',
    },
  },
)
