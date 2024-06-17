import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/module.ts',
    './src/utils.ts',
    './src/cli.ts',
  ],
  externals: [
    'consola',
    'pathe',
    'chalk',
    'prompts',
    'edgedb',
    '@edgedb/generate',
  ],
})
