import { defineNuxtModule, createResolver, addServerHandler, addComponentsDir, addPlugin, addImportsDir } from '@nuxt/kit'
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
  composables: boolean
  auth: boolean
  oauth: boolean
  injectDbCredentials: boolean
  projectInit: boolean
  installCli: boolean
}

const { resolve: resolveLocal } = createResolver(import.meta.url)

const activePrompts = {
  initPrompt: undefined as any,
  installCliPrompt: undefined as any,
  migrationPrompt: undefined as any,
  queriesPrompt: undefined as any,
  schemaPrompt: undefined as any,
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-edgedb-module',
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
    generateQuiet: true,
    projectInit: true,
    installCli: true,
    composables: true,
    injectDbCredentials: true,
    auth: false,
    oauth: false,
  },
  async setup(options, nuxt) {
    const { success, error, edgeColor } = useLogger()
    const { resolve: resolveProject } = createResolver(nuxt.options.rootDir)
    const dbschemaDir = resolveProject(options.dbschemaDir)
    const queriesDir = resolveProject(options.queriesDir)
    const queryBuilderDir = resolveProject(options.queryBuilderDir)
    const edgeDbConfigPath = resolveProject('edgedb.toml')
    const hasConfigFile = () => fs.existsSync(edgeDbConfigPath)

    async function generateInterfaces(quiet: boolean = options.generateQuiet) {
      if (options.generateInterfaces) {
        try {
          const interfacesGenerateProcess = $`npx @edgedb/generate interfaces --file=${join(dbschemaDir, 'interfaces.ts')} --force-overwrite --target=${options.generateTarget}`
          if (!quiet) interfacesGenerateProcess.stdout?.pipe?.(process.stdout)
          await new Promise<void>((resolve) => interfacesGenerateProcess.on('close', resolve))
        } catch (e) {
          error(`Could not generate ${edgeColor('EdgeDB')} interfaces.`)
        }
      }
    }

    async function generateQueries(quiet: boolean = options.generateQuiet) {
      if (options.generateInterfaces) {
        try {
          const queriesGenerateProcess = $`npx @edgedb/generate queries --file --force-overwrite --target=${options.generateTarget}`
          if (!quiet) queriesGenerateProcess.stdout?.pipe?.(process.stdout)
          await new Promise<void>((resolve) => queriesGenerateProcess.on('close', resolve))
        } catch (e) {
          error(`Could not generate ${edgeColor('EdgeDB')} interfaces.`)
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
          error(`Could not generate ${edgeColor('EdgeDB')} interfaces.`)
        }
      }
    }

    /**
     * CLI Install detection
     */

    let edgedbCliVersion = (await $`edgedb --version`).stdout.replace('EdgeDB CLI ', '')

    if (nuxt.server && options.installCli && !edgedbCliVersion) {
      error(`Could not find ${edgeColor('EdgeDB')} CLI.`, true)
      activePrompts.installCliPrompt = prompts(
        {
          type: 'confirm',
          name: 'value',
          message: 'Do you want to install EdgeDB CLI?',
          warn: 'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.edgedb.com | sh'
        },
        {
          async onSubmit(_, response) {
            if (response.value === true) {
              try {
                await $`curl --proto \'=https\' --tlsv1.2 -sSf https://sh.edgedb.com | sh`
                edgedbCliVersion = (await $`edgedb --version`).stdout.replace('EdgeDB CLI ', '')
                success(`EdgeDB CLI version ${edgedbCliVersion} installed.`, true)
              } catch (e) {
                error('Failed to install EdgeDB CLI.', true)
              }
            }
          }
        }
      );
    } else {


      nuxt.hook(
        'modules:done',
        () => {
          if (edgedbCliVersion) {
            success(`Using ${edgeColor('EdgeDB')} version ${edgeColor(edgedbCliVersion)}.`, true)
          }
        }
      )
    }


    /**
     * EdgeDB Init wizard
     */

    if (nuxt.server && options.projectInit && !hasConfigFile()) {
      logger.log(`  ${chalk.red('➜')} Could not find ${edgeColor('EdgeDB')} configuration file.`, true)
      activePrompts.initPrompt = prompts(
        {
          type: 'confirm',
          name: 'value',
          message: 'Do you want to run `edgedb project init`?',
        },
        {
          async onSubmit(_, response) {
            if (response.value === true) {
              try {
                const edgeDbProcess = $`edgedb project init --project-dir=${nuxt.options.rootDir}`

                edgeDbProcess.stdout?.pipe?.(process.stdout)

                await new Promise<void>((resolve) => edgeDbProcess.on('close', resolve))

                success(`EdgeDB project initialized.`, true)
              } catch (e) {
                error('Failed to init EdgeDB project.', true)
              }
            }
          }
        }
      );
    }

    /**
     * Devtools
     */

    if (nuxt.server && options.devtools) {
      const uiUrl = await $`edgedb ui --print-url`

      if (uiUrl.stdout) {
        nuxt.hook('devtools:customTabs', (tabs) => {
          tabs.push({
            // unique identifier
            name: 'nuxt-edgedb-module',
            // title to display in the tab
            title: 'EdgeDB',
            // any icon from Iconify, or a URL to an image
            icon: 'logos:edgedb',
            category: 'app',
            // iframe view
            view: {
              type: 'iframe',
              src: uiUrl.stdout,
              persistent: true
            },
          })
        })
      }
    }


    /**
     * Watchers
     */

    if (nuxt.server && options.watch) {
      nuxt.options.watch.push(dbschemaDir + '/*')
      nuxt.options.watch.push(dbschemaDir + '/migrations/*')
      nuxt.options.watch.push(queriesDir + '/*')

      nuxt.hook('builder:watch', async (event, path) => {
        if (event === 'add' || event === 'change' || event === 'unlink' || event === 'unlinkDir') {
          // Queries
          if (path.includes(options.queriesDir) && path.endsWith('.edgeql')) {
            success(`Queries changes detected on: ${edgeColor(path.replace(options.dbschemaDir, ''))}`)
            try {
              if (options.watchPrompt) {
                prompts(
                  {
                    type: 'confirm',
                    name: 'value',
                    message: 'Do you want to generate queries files?',
                  },
                  {
                    onSubmit: async (_, response) => {
                      if (response.value === true) {
                        await generateQueries()
                        success('Successfully generated queries!')
                      }
                    }
                  }
                )
                return
              } else {
                await generateQueries()
                success('Successfully generated queries!')
              }
            } catch (e) {
              //
            }
            return
          }

          // Migrations
          if (path.includes(options.dbschemaDir + '/migrations') && path.endsWith('.edgeql')) {
            success(`Migrations changes detected on: ${edgeColor(path.replace(options.dbschemaDir, ''))}`)
            try {
              if (options.watchPrompt) {
                activePrompts.migrationPrompt = prompts(
                  {
                    type: 'confirm',
                    name: 'value',
                    message: 'Do you want to run `edgedb migrate`?',

                  },
                  {
                    onSubmit: async (_, response) => {
                      if (response.value === true) {
                        const migrateProcess = $`edgedb migrate`

                        migrateProcess.stdout?.pipe?.(process.stdout)

                        await new Promise<void>((resolve) => migrateProcess.on('close', resolve))

                        success('Successfully migrated database!')

                        await generateInterfaces()
                        await generateQueries()
                        await generateQueryBuilder()
                      }
                    }
                  }
                )
              } else {
                const migrateProcess = $`edgedb migrate`

                migrateProcess.stdout?.pipe?.(process.stdout)

                await new Promise<void>((resolve) => migrateProcess.on('close', resolve))

                success('Successfully migrated database!')

                await generateInterfaces()
                await generateQueries()
                await generateQueryBuilder()
              }
            } catch (e) {
              //
            }
            return
          }

          // Schema
          if (path.includes(options.dbschemaDir) && path.endsWith('.esdl')) {
            success(`Schema changes detected on: ${edgeColor(path.replace(options.dbschemaDir, ''))}`)
            try {
              if (options.watchPrompt) {
                activePrompts.schemaPrompt = prompts({
                  type: 'confirm',
                  name: 'value',
                  message: 'Do you want to run `edgedb migration create`?'
                },
                  {
                    onSubmit: async (_, response) => {
                      if (response.value === true) {
                        const migrationCreateProcess = $`edgedb migration create`

                        migrationCreateProcess.stdout?.pipe?.(process.stdout)

                        await new Promise<void>((resolve) => migrationCreateProcess.on('close', resolve))

                        success('Migration created!')
                      }
                    }
                  })
              } else {
                const migrationCreateProcess = $`edgedb migration create`

                migrationCreateProcess.stdout?.pipe?.(process.stdout)

                await new Promise<void>((resolve) => migrationCreateProcess.on('close', resolve))

                success('Migration created!')
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

      nuxt.hook('prepare:types', async () => {
        await generateInterfaces()
        await generateQueries()
        await generateQueryBuilder()
      })
    }

    if (options.composables) {
      // Add server-side auto-imports
      nuxt.hook(
        'nitro:config',
        (config) => {
          if (!config.imports)
            config.imports = {}
          if (!config.imports.dirs)
            config.imports.dirs = []
          config.imports.dirs.push(resolveLocal('./runtime/server'))
        },
      )
    }

    if (options.auth) {
      if (!process.env.NUXT_EDGEDB_AUTH_BASE_URL && options.injectDbCredentials) {
        // http://localhost:10702/db/edgedb/ext/auth/
        const dbCredentials = await $`edgedb instance credentials --json`
        const { host, port, database } = JSON.parse(dbCredentials.stdout)
        process.env.NUXT_EDGEDB_AUTH_BASE_URL = `http://${host}:${port}/${database}/ext/auth/`
      }

      // Runtime
      addPlugin({
        src: resolveLocal('./runtime/plugin/edgedb-auth.ts'),
        mode: 'all'
      })
      addComponentsDir({
        path: resolveLocal('./runtime/components/auth/base'),
        global: true
      })
      addImportsDir(resolveLocal('./runtime/composables'))

      // Server
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/login'),
        route: '/api/auth/login',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/verify'),
        route: '/api/auth/verify',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/callback'),
        route: '/api/auth/callback',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/reset-password-ui'),
        route: '/api/auth/reset-password-ui',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/reset-password'),
        route: '/api/auth/reset-password',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/send-password-reset-email'),
        route: '/api/auth/send-password-reset-email',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/signup'),
        route: '/api/auth/signup',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/identity'),
        route: '/api/auth/identity',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/providers'),
        route: '/api/auth/providers',
      })
    }

    if (options.oauth) {
      addComponentsDir({
        path: resolveLocal('./runtime/components/auth/oauth'),
        global: true
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/authorize'),
        route: '/api/auth/authorize',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/callback'),
        route: '/api/auth/callback',
      })
    }
  }
})

const logger = createConsola({
  defaults: {
    tag: 'edgedb'
  }
})
function useLogger() {
  const error = (message: string, boot: boolean = false) => logger.log(`${boot ? `  ` : ``}${chalk.red('➜')} ${message}`)
  const successLog = (message: string, boot: boolean = false) => logger.log(`${boot ? `  ` : ``}${chalk.green('➜')} ${message}`)
  const edgeColor = (content: string) => chalk.rgb(12, 203, 147)(content)


  return Object.assign(
    logger,
    {
      error: error,
      success: successLog,
      edgeColor: edgeColor
    }
  )
}
