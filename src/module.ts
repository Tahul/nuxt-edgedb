import { defineNuxtModule, createResolver, addServerHandler, addComponentsDir, addPlugin, addImportsDir } from '@nuxt/kit'
import { createConsola } from 'consola'
import { join } from 'pathe'
import chalk from 'chalk'
import fs from 'fs'
import prompts from 'prompts'
import { execaCommand } from 'execa'

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
    const { successMessage: success, errorMessage: error, edgeColor } = useLogger()
    const { resolve: resolveProject } = createResolver(nuxt.options.rootDir)
    const dbschemaDir = resolveProject(options.dbschemaDir)
    const queriesDir = resolveProject(options.queriesDir)
    const queryBuilderDir = resolveProject(options.queryBuilderDir)
    const edgeDbConfigPath = resolveProject('edgedb.toml')
    const hasConfigFile = () => fs.existsSync(edgeDbConfigPath)
    const canPrompt = nuxt.options.dev

    async function generateInterfaces(quiet: boolean = options.generateQuiet) {
      if (options.generateInterfaces) {
        try {
          await piped$(`npx @edgedb/generate interfaces --file=${join(dbschemaDir, 'interfaces.ts')} --force-overwrite`, quiet)
        } catch (e) {
          error(`Could not generate ${edgeColor('EdgeDB')} interfaces.`)
          logger.error(e)
        }
      }
    }

    async function generateQueries(quiet: boolean = options.generateQuiet) {
      if (options.generateInterfaces) {
        try {
          await piped$(`npx @edgedb/generate queries --file --force-overwrite --target=${options.generateTarget}`, quiet)
        } catch (e) {
          error(`Could not generate ${edgeColor('EdgeDB')} interfaces.`)
          logger.error(e)
        }
      }
    }

    async function generateQueryBuilder(quiet: boolean = options.generateQuiet) {
      if (options.generateInterfaces) {
        try {
          await piped$(`npx @edgedb/generate edgeql-js --output-dir=${queryBuilderDir} --force-overwrite --target=${options.generateTarget}`, quiet)
        } catch (e) {
          error(`Could not generate ${edgeColor('EdgeDB')} interfaces.`)
          logger.error(e)
        }
      }
    }

    /**
     * CLI Install detection
     */
    let edgedbCliVersion = (await execaCommand(`edgedb --version`)).stdout.replace('EdgeDB CLI ', '')

    if (options.installCli && !edgedbCliVersion) {
      error(`Could not find ${edgeColor('EdgeDB')} CLI.`, true)
      if (activePrompts.installCliPrompt) { return }
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
                await execaCommand(`curl --proto '=https' --tlsv1.2 -sSf https://sh.edgedb.com | sh`)
                edgedbCliVersion = (await execaCommand(`edgedb --version`)).stdout.replace('EdgeDB CLI ', '')
                success(`EdgeDB CLI version ${edgedbCliVersion} installed.`, true)
              } catch (e) {
                error('Failed to install EdgeDB CLI.', true)
              }
            }
            activePrompts.installCliPrompt = undefined
          },
          onCancel() {
            activePrompts.installCliPrompt = undefined
          }
        }
      );
      await activePrompts.installCliPrompt
    } else {
      success(`Using ${edgeColor('EdgeDB')} version ${edgeColor(edgedbCliVersion)}.`, true)
    }


    /**
     * EdgeDB Init wizard
     */

    if (canPrompt && options.projectInit && !hasConfigFile()) {
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
                await piped$(`edgedb project init --project-dir=${nuxt.options.rootDir}`)

                success(`EdgeDB project initialized.`, true)

                activePrompts.initPrompt = undefined
              } catch (e) {
                error('Failed to init EdgeDB project.', true)
              }
            }
          },
          onCancel() {
            activePrompts.initPrompt = undefined
          }
        }
      );
      await activePrompts.initPrompt
    }

    /**
     * Devtools
     */

    if (canPrompt && options.devtools) {
      const uiUrl = await execaCommand(`edgedb ui --print-url`)

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

    if (canPrompt && options.watch) {
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
                activePrompts.queriesPrompt = prompts(
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
                await activePrompts.queriesPrompt
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
                if (activePrompts.migrationPrompt) { return }
                activePrompts.migrationPrompt = prompts(
                  {
                    type: 'confirm',
                    name: 'value',
                    message: 'Do you want to run `edgedb migrate`?',
                  },
                  {
                    onSubmit: async (_, response) => {
                      if (response.value === true) {
                        await piped$(`edgedb migrate`)
                        await generateInterfaces()
                        await generateQueries()
                        await generateQueryBuilder()
                      }

                      success('Successfully migrated database!')

                      activePrompts.migrationPrompt = undefined
                    },
                    onCancel() {
                      activePrompts.migrationPrompt = undefined
                    }
                  }
                )
                await activePrompts.migrationPrompt
              } else {
                await piped$(`edgedb migrate`)

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
                if (activePrompts.schemaPrompt) { return }
                activePrompts.schemaPrompt = prompts({
                  type: 'confirm',
                  name: 'value',
                  message: 'Do you want to run `edgedb migration create`?'
                },
                  {
                    onSubmit: async (_, response) => {
                      if (response.value === true) {
                        await piped$(`edgedb migration create`)
                        success('Migration created!')
                      }
                      activePrompts.schemaPrompt = undefined
                    },
                    onCancel() {
                      activePrompts.schemaPrompt = undefined
                    }
                  })
                await activePrompts.schemaPrompt
              } else {
                await piped$(`edgedb migration create`)
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
        const dbCredentials = await execaCommand(`edgedb instance credentials --json`)
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
  const errorMessage = (message: string, boot: boolean = false) => logger.log(`${boot ? `  ` : ``}${chalk.red('➜')} ${message}`)
  const successMessage = (message: string, boot: boolean = false) => logger.log(`${boot ? `  ` : ``}${chalk.green('➜')} ${message}`)
  const edgeColor = (content: string) => chalk.rgb(12, 203, 147)(content)


  return Object.assign(
    logger,
    {
      errorMessage,
      successMessage,
      edgeColor: edgeColor
    }
  )
}

async function piped$(
  command: string,
  quiet: boolean = false
) {
  const commandProcess = execaCommand(command)
  const commandProcessClosePromise = new Promise<void>((resolve) => commandProcess.on('close', resolve))
  if (!quiet) commandProcess.stdout?.pipe?.(process.stdout)
  await commandProcess
  await commandProcessClosePromise
}
