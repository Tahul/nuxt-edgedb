import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: [
    'consola',
    'pathe',
    'chalk',
    'prompts',
    'edgedb',
    '@edgedb/generate',
  ],
})
