import { defineNuxtModule, createResolver } from '@nuxt/kit'
import { createConsola } from 'consola'
import { join } from 'pathe'
import chalk from 'chalk'
import fs from 'fs'
import prompts from 'prompts'
import { $ } from 'execa'

// Module options TypeScript interface definition
export interface ModuleOptions {
  devtools: boolean
  watch: boolean
  watchPrompt: true
  dbschemaDir: string
  queriesDir: string
  queryBuilderDir: string
  generateTarget: 'ts' | 'mts' | 'esm' | 'cjs' | 'deno'
  generateInterfaces: boolean
  generateQueries: boolean
  generateQueryBuilder: boolean
  generateQuiet: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-edgedb',
    configKey: 'edgeDb'
  },
  // Default configuration options of the Nuxt module
  defaults: {
    devtools: true,
    watch: true,
    watchPrompt: true,
    generateTarget: 'ts',
    dbschemaDir: 'dbschema',
    queriesDir: 'queries',
    queryBuilderDir: 'dbschema/query-builder',
    generateInterfaces: true,
    generateQueries: true,
    generateQueryBuilder: true,
    generateQuiet: true
  },
  async setup(options, nuxt) {
    const logger = createConsola({
      defaults: {
        tag: 'edgedb'
      }
    })
    const errorLog = (message: string, boot: boolean = false) => logger.log(`${boot ? `  ` : ``}${chalk.red('➜')} ${message}`)
    const successLog = (message: string, boot: boolean = false) => logger.log(`${boot ? `  ` : ``}${chalk.green('➜')} ${message}`)
    const edgeDbColor = (content: string) => chalk.rgb(12, 203, 147)(content)

    const { resolve: resolveProject } = createResolver(nuxt.options.rootDir)
    const dbschemaDir = resolveProject(options.dbschemaDir)
    const queriesDir = resolveProject(options.queriesDir)
    const queryBuilderDir = resolveProject(options.queryBuilderDir)


    async function generateInterfaces(quiet: boolean = options.generateQuiet) {
      if (options.generateInterfaces) {
        try {
          const interfacesGenerateProcess = $`npx @edgedb/generate interfaces --file=${join(dbschemaDir, 'interfaces.ts')} --force-overwrite --target=${options.generateTarget}`
          if (!quiet) interfacesGenerateProcess.stdout?.pipe?.(process.stdout)
          await new Promise<void>((resolve) => interfacesGenerateProcess.on('close', resolve))
        } catch (e) {
          errorLog(`Could not generate ${edgeDbColor('EdgeDB')} interfaces.`)
        }
      }
    }
    async function generateQueries(quiet: boolean = options.generateQuiet) {
      if (options.generateInterfaces) {
        try {
          const queriesGenerateProcess = $`npx @edgedb/generate queries --file=${join(dbschemaDir, 'queries.ts')} --force-overwrite --target=${options.generateTarget}`
          if (!quiet) queriesGenerateProcess.stdout?.pipe?.(process.stdout)
          await new Promise<void>((resolve) => queriesGenerateProcess.on('close', resolve))
        } catch (e) {
          errorLog(`Could not generate ${edgeDbColor('EdgeDB')} interfaces.`)
        }
      }
    }
    async function generateQueryBuilder(quiet: boolean = options.generateQuiet) {
      if (options.generateInterfaces) {
        try {
          const queryBuilderGenerateProcess = $`npx @edgedb/generate edgeql-js --output-dir=${queryBuilderDir} --force-overwrite --target=${options.generateTarget}`
          if (!quiet) queryBuilderGenerateProcess.stdout?.pipe?.(process.stdout)
          await new Promise<void>((resolve) => queryBuilderGenerateProcess.on('close', resolve))
        } catch (e) {
          errorLog(`Could not generate ${edgeDbColor('EdgeDB')} interfaces.`)
        }
      }
    }

    let edgedbCliVersion = (await $`edgedb --version`).stdout.replace('EdgeDB CLI ', '')

    if (!edgedbCliVersion) {
      errorLog(`Could not find ${edgeDbColor('EdgeDB')} CLI.`, true)
      const response = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Do you want to install EdgeDB CLI?',
        warn: 'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.edgedb.com | sh'
      });
      if (response.value === true) {
        try {
          await $`curl --proto \'=https\' --tlsv1.2 -sSf https://sh.edgedb.com | sh`
          edgedbCliVersion = (await $`edgedb --version`).stdout.replace('EdgeDB CLI ', '')
          successLog(`EdgeDB CLI version ${edgedbCliVersion} installed.`, true)
        } catch (e) {
          errorLog('Failed to install EdgeDB CLI.', true)
        }
      }
    } else {
      successLog(`Using ${edgeDbColor('EdgeDB')} version ${edgeDbColor(edgedbCliVersion)}.`, true)
    }

    const edgeDbConfigPath = resolveProject('edgedb.toml')

    if (!fs.existsSync(edgeDbConfigPath)) {
      logger.log(`  ${chalk.red('➜')} Could not find ${edgeDbColor('EdgeDB')} configuration file.`, true)
      const response = await prompts({
        type: 'confirm',
        name: 'value',
        message: 'Do you want to run `edgedb project init`?'
      });
      if (response.value === true) {
        try {
          const edgeDbProcess = $`edgedb project init --project-dir=${nuxt.options.rootDir}`

          edgeDbProcess.stdout?.pipe?.(process.stdout)

          await new Promise<void>((resolve) => edgeDbProcess.on('close', resolve))

          successLog(`EdgeDB project initialized.`, true)
        } catch (e) {
          errorLog('Failed to init EdgeDB project.', true)
        }
      }
    }

    if (options.devtools) {
      const uiUrl = await $`edgedb ui --print-url`

      if (uiUrl.stdout) {
        nuxt.hook('devtools:customTabs', (tabs) => {
          tabs.push({
            // unique identifier
            name: 'nuxt-edgedb',
            // title to display in the tab
            title: 'EdgeDB',
            // any icon from Iconify, or a URL to an image
            icon: 'logos:edgedb',
            // iframe view
            view: {
              type: 'iframe',
              src: uiUrl.stdout,
            },
          })
        })
      }
    }

    if (options.watch) {
      nuxt.options.watch.push(dbschemaDir + '/*')
      nuxt.options.watch.push(dbschemaDir + '/migrations/*')
      nuxt.options.watch.push(queriesDir + '/*')

      nuxt.hook('builder:watch', async (event, path) => {
        if (event === 'add' || event === 'change' || event === 'unlink' || event === 'unlinkDir') {
          if (path.includes(options.queriesDir) && path.endsWith('.edgeql')) {
            successLog(`Queries changes detected on: ${edgeDbColor(path.replace(options.dbschemaDir, ''))}`)
            try {
              const response = options.watchPrompt ? await prompts({
                type: 'confirm',
                name: 'value',
                message: 'Do you want to generate queries files?'
              }) : { value: true }

              if (response.value === true) {
                await generateQueries()
                successLog('Successfully generated queries!')
              }
            } catch (e) {
              //
            }
            return
          }
          if (path.includes(options.dbschemaDir + '/migrations') && path.endsWith('.edgeql')) {
            successLog(`Migrations changes detected on: ${edgeDbColor(path.replace(options.dbschemaDir, ''))}`)
            try {
              const response = options.watchPrompt
                ? await prompts({
                  type: 'confirm',
                  name: 'value',
                  message: 'Do you want to run `edgedb migrate`?'
                }) : { value: true }

              if (response.value === true) {
                const migrateProcess = $`edgedb migrate`

                migrateProcess.stdout?.pipe?.(process.stdout)

                await new Promise<void>((resolve) => migrateProcess.on('close', resolve))

                successLog('Successfully migrated database!')

                await generateInterfaces()
                await generateQueries()
                await generateQueryBuilder()
              }
            } catch (e) {
              //
            }
            return
          }

          if (path.includes(options.dbschemaDir) && path.endsWith('.esdl')) {
            successLog(`Schema changes detected on: ${edgeDbColor(path.replace(options.dbschemaDir, ''))}`)
            try {
              const response = options.watchPrompt ? await prompts({
                type: 'confirm',
                name: 'value',
                message: 'Do you want to run `edgedb migration create`?'
              }) : { value: true }

              if (response.value === true) {
                const migrationCreateProcess = $`edgedb migration create`

                migrationCreateProcess.stdout?.pipe?.(process.stdout)

                await new Promise<void>((resolve) => migrationCreateProcess.on('close', resolve))

                successLog('Migration created!')
              }
            } catch (e) {
              //
            }
            return
          }
        }
      })
    }

    if (options.generateInterfaces || options.generateQueries || options.generateQueryBuilder) {
      const nuxtOptions = nuxt.options

      if (options.generateQueries) nuxtOptions.alias['@db/queries'] = join(dbschemaDir, '/queries.ts')
      if (options.generateInterfaces) nuxtOptions.alias['@db/interfaces'] = join(dbschemaDir, '/interfaces.ts')
      if (options.generateQueryBuilder) nuxtOptions.alias['@db/builder'] = join(dbschemaDir, '/query-builder/index.ts')

      nuxt.hook('prepare:types', async (_nuxtOptions) => {
        await generateInterfaces()
        await generateQueries()
        await generateQueryBuilder()
      })
    }
  }
})
