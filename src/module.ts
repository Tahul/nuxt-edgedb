import { existsSync } from 'node:fs'
import type { NuxtModule } from 'nuxt/schema'
import { addComponentsDir, addImports, addPlugin, addServerHandler, addServerImports, addServerPlugin, createResolver, defineNuxtModule, logger } from '@nuxt/kit'
import { join } from 'pathe'
import * as execa from 'execa'
import chalk from 'chalk'
import { getEdgeDbConfiguration } from './utils'

// Module options TypeScript interface definition
export interface ModuleOptions {
  devtools: boolean
  watch: boolean
  watchPrompt: true
  dbschemaDir: string
  queriesDir: string
  composables: boolean
  auth: boolean
  oauth: boolean
  injectDbCredentials: boolean
  projectInit: boolean
  installCli: boolean
  identityModel: string
}

const { resolve: resolveLocal } = createResolver(import.meta.url)

const nuxtModule = defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-edgedb-module',
    configKey: 'edgeDb',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    devtools: true,
    watch: true,
    watchPrompt: true,
    dbschemaDir: 'dbschema',
    queriesDir: 'queries',
    projectInit: true,
    installCli: true,
    composables: true,
    injectDbCredentials: true,
    auth: false,
    oauth: false,
    identityModel: 'User',
  },
  async setup(options, nuxt) {
    const { resolve: resolveProject } = createResolver(nuxt.options.rootDir)
    const dbschemaDir = resolveProject(options.dbschemaDir)
    const canPrompt = nuxt.options.dev

    // Transpile edgedb
    nuxt.options.build.transpile ??= []
    nuxt.options.build.transpile.push('edgedb')
    nuxt.options.build.transpile.push('nuxt-edgedb-module')

    const envAppUrl = process.env.APP_URL || process.env.NUXT_EDGEDB_APP_URL

    // Create dev app url
    const devAppUrl = [
      nuxt.options.devServer.https ? `https://` : `http://`,
      nuxt.options.devServer.host ? nuxt.options.devServer.host : 'localhost',
      nuxt.options.devServer.port ? `:${nuxt.options.devServer.port}` : '',
    ].join('')

    const appUrl = envAppUrl || devAppUrl

    // Inject runtime configuration
    nuxt.options.runtimeConfig.edgeDb ??= await getEdgeDbConfiguration(appUrl, options, resolveProject(), options.injectDbCredentials) as any

    /**
     * Devtools
     */

    if (canPrompt && options.devtools) {
      let uiUrl: any | undefined
      if (!process.env.NUXT_EDGEDB_UI_URL && options.injectDbCredentials) {
        try {
          uiUrl = await execa.execa(`edgedb`, ['ui', '--print-url'], { cwd: resolveProject() })
        }
        catch (e) {
          //
        }
      }

      if (process.env?.NUXT_EDGEDB_UI_URL || uiUrl?.stdout) {
        nuxt.hook('devtools:customTabs' as any, (tabs: any[]) => {
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
              src: process.env?.NUXT_EDGEDB_UI_URL || uiUrl.stdout,
              persistent: true,
            },
          })
        })
      }
    }

    if (!existsSync(dbschemaDir)) {
      logger.withTag('edgedb').error(`Could not find dbschema directory.\n\nYou must run "${chalk.green.bold('edgedb project init')}" in your project root.`)
      process.exit(1)
    }

    const queriesPath = join(dbschemaDir, '/queries.ts')
    const interfacesPath = join(dbschemaDir, '/interfaces.ts')
    const builderPath = join(dbschemaDir, '/query-builder/index.ts')

    const hasQueries = existsSync(queriesPath)
    const hasInterfaces = existsSync(interfacesPath)
    const hasQueryBuilder = existsSync(builderPath)

    // Inject aliases
    const nuxtOptions = nuxt.options
    nuxtOptions.alias = nuxtOptions.alias ?? {}

    if (hasQueries)
      nuxtOptions.alias['#edgedb/queries'] = queriesPath
    if (hasInterfaces)
      nuxtOptions.alias['#edgedb/interfaces'] = interfacesPath
    if (hasQueryBuilder)
      nuxtOptions.alias['#edgedb/builder'] = builderPath

    if (options.composables) {
      // Add server plugin for EdgeDB client
      addServerPlugin(resolveLocal('./runtime/server/plugins/edgedb-client'))

      // Add server imports manually
      addServerImports([
        {
          from: resolveLocal('./runtime/server/composables/useEdgeDb'),
          name: 'useEdgeDb',
        },
        {
          from: resolveLocal('./runtime/server/composables/useEdgeDbEnv'),
          name: 'useEdgeDbEnv',
        },
        {
          from: resolveLocal('./runtime/server/composables/useEdgeDbPKCE'),
          name: 'useEdgeDbPKCE',
        },
      ])

      if (hasQueryBuilder) {
        addServerImports([
          {
            from: resolveLocal('./runtime/server/composables/useEdgeDbQueryBuilder'),
            name: 'useEdgeDbQueryBuilder',
          },
        ])
      }

      if (hasQueries) {
        addServerImports([
          {
            from: resolveLocal('./runtime/server/composables/useEdgeDbQueries'),
            name: 'useEdgeDbQueries',
          },
        ])
      }

      // Add server-side auto-imports
      nuxt.hook(
        'nitro:config',
        (config) => {
          // Push externals
          config.externals ??= {}
          config.externals.inline ??= []
          config.externals.inline.push(resolveLocal('./runtime/server'))

          // Fixes for weird cjs query builder imports
          if (hasQueryBuilder) {
            config.replace ??= {}
            config.replace['edgedb/dist/primitives/buffer'] = 'edgedb/dist/primitives/buffer.js'
            config.replace['edgedb/dist/reflection/index'] = 'edgedb/dist/reflection/index.js'
          }

          // Push server aliases
          config.alias ??= {}

          if (hasQueries)
            config.alias['#edgedb/queries'] = join(dbschemaDir, '/queries.ts')
          if (hasInterfaces)
            config.alias['#edgedb/interfaces'] = join(dbschemaDir, '/interfaces.ts')
          if (hasQueryBuilder)
            config.alias['#edgedb/builder'] = join(dbschemaDir, '/query-builder/index.ts')

          // Enforce paths on typescript config
          config.typescript ??= {}
          config.typescript.tsConfig ??= {}
          config.typescript.tsConfig.compilerOptions ??= {}
          config.typescript.tsConfig.compilerOptions.paths ??= {}

          if (hasQueries)
            config.typescript.tsConfig.compilerOptions.paths['#edgedb/queries'] = [`${join(dbschemaDir, '/queries.ts')}`]
          if (hasInterfaces)
            config.typescript.tsConfig.compilerOptions.paths['#edgedb/interfaces'] = [`${join(dbschemaDir, '/interfaces.ts')}`]
          if (hasQueryBuilder)
            config.typescript.tsConfig.compilerOptions.paths['#edgedb/builder'] = [`${join(dbschemaDir, '/query-builder/index.ts')}`]
        },
      )
    }

    if (options.auth) {
      // Runtime
      addPlugin({
        src: resolveLocal('./runtime/plugins/edgedb-auth'),
        mode: 'all',
      })
      addComponentsDir({
        path: resolveLocal('./runtime/components/auth/base'),
        global: true,
      })
      addImports([
        {
          from: resolveLocal('./runtime/composables/useEdgeDbIdentity'),
          name: 'useEdgeDbIdentity',
        },
      ])

      // Server
      addServerImports([
        {
          from: resolveLocal('./runtime/server/composables/useEdgeDbIdentity'),
          name: 'useEdgeDbIdentity',
        },
      ])
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/login'),
        route: '/api/auth/login',
      })
      addServerHandler({
        handler: resolveLocal('./runtime/api/auth/logout'),
        route: '/api/auth/logout',
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
        global: true,
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
  },
})

export default nuxtModule

declare module 'nuxt/schema' {
  interface NuxtConfig {
    ['edgeDb']?: typeof nuxtModule extends NuxtModule<infer O> ? Partial<O> : Record<string, any>
  }

  interface RuntimeConfig {
    edgeDb: {
      auth: {
        enabled: boolean
        oauth: boolean
        identityModel: string
      }
      identityModel?: string
      urls: {
        appUrl?: string
        authBaseUrl?: string
        resetPasswordUrl?: string
        verifyRedirectUrl?: string
        oAuthCallbackUrl?: string
        oAuthRedirectUrl?: string
      }
      dsn: {
        host?: string
        port?: string
        user?: string
        pass?: string
        database?: string
        tlsCA?: string
        tlsSecurity?: 'insecure' | 'no_host_verification' | 'strict' | 'default' | undefined
      }
    }
  }

  interface PublicRuntimeConfig {

  }
}
