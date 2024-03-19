import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/module.ts',
    './src/utils.ts',
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
