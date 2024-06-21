import { execa } from 'execa'
import type { ModuleOptions } from './module'

export async function getEdgeDbCredentials(
  cwd: string,
  processInject: boolean = true,
) {
  let dbCredentials: any | undefined

  try {
    dbCredentials = await execa({ cwd })`edgedb instance credentials --json`
  }
  catch (e) {
    // Silently fail, the EdgeDB instance credentials command failed.
  }

  if (dbCredentials) {
    const { host, port, database, user, password, tls_ca, tls_security } = JSON.parse(dbCredentials.stdout)

    if (processInject) {
      if (!process.env.NUXT_EDGEDB_HOST)
        process.env.NUXT_EDGEDB_HOST = host
      if (!process.env.NUXT_EDGEDB_PORT)
        process.env.NUXT_EDGEDB_PORT = port
      if (!process.env.NUXT_EDGEDB_DATABASE)
        process.env.NUXT_EDGEDB_DATABASE = database
      if (!process.env.NUXT_EDGEDB_USER)
        process.env.NUXT_EDGEDB_USER = user
      if (!process.env.NUXT_EDGEDB_PASS)
        process.env.NUXT_EDGEDB_PASS = password
      if (!process.env.NUXT_EDGEDB_TLS_CA)
        process.env.NUXT_EDGEDB_TLS_CA = tls_ca
      if (!process.env.NUXT_EDGEDB_TLS_SECURITY)
        process.env.NUXT_EDGEDB_TLS_SECURITY = tls_security
      if (!process.env.NUXT_EDGEDB_AUTH_BASE_URL)
        process.env.NUXT_EDGEDB_AUTH_BASE_URL = `http://${host}:${port}/db/${database}/ext/auth/`
    }

    return { host, port, database, user, password, tls_ca, tls_security }
  }
}

export async function getEdgeDbConfiguration(
  appUrl: string,
  options: Partial<ModuleOptions> = {},
  cwd: string = process.cwd(),
  processInject: boolean = true,
) {
  await getEdgeDbCredentials(cwd, processInject)

  const {
    // EdgeDB DSN settings
    NUXT_EDGEDB_HOST: host,
    NUXT_EDGEDB_PORT: port,
    NUXT_EDGEDB_USER: user,
    NUXT_EDGEDB_PASS: pass,
    NUXT_EDGEDB_DATABASE: database,
    NUXT_EDGEDB_TLS_CA: tlsCA,
    NUXT_EDGEDB_TLS_SECURITY: tlsSecurity,

    // EdgeDB Auth settings
    NUXT_EDGEDB_IDENTITY_MODEL: identityModel = options?.identityModel || 'User',

    // EdgeDB Auth URls
    NUXT_EDGEDB_AUTH_BASE_URL: authBaseUrl = `http://${host}:${port}/db/${database}/ext/auth/`,
    NUXT_EDGEDB_OAUTH_CALLBACK: oAuthCallbackUrl = `http://${host}:${port}/db/${database}/ext/auth/callback`,

    // EdgeDB Nuxt Auth URLs
    NUXT_EDGEDB_AUTH_VERIFY_REDIRECT_URL: verifyRedirectUrl = `${appUrl}/auth/verify`,
    NUXT_EDGEDB_AUTH_RESET_PASSWORD_URL: resetPasswordUrl = `${appUrl}/auth/reset-password`,
    NUXT_EDGEDB_OAUTH_REDIRECT_URL: oAuthRedirectUrl = `${appUrl}/auth/callback`,
  } = process.env

  const dsn = {
    host,
    port,
    user,
    pass,
    database,
    tlsCA,
    tlsSecurity: tlsSecurity as 'insecure' | 'no_host_verification' | 'strict' | 'default' | undefined,
    full: `edgedb://${user}:${pass}@${host}:${port}/${database}`,
  }

  const urls = {
    // EdgeDB Nuxt Auth URLs
    appUrl,
    resetPasswordUrl,
    verifyRedirectUrl,
    oAuthRedirectUrl,

    // EdgeDB Auth URls
    authBaseUrl,
    oAuthCallbackUrl,
  }

  const auth = {
    enabled: options?.auth || false,
    oauth: options?.oauth || false,
    identityModel,
  }

  return {
    auth,
    dsn,
    urls,
  }
}
