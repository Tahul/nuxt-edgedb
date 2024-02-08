export function useEdgeDbEnv() {
  const {
    APP_URL: appUrl,
    NUXT_EDGEDB_HOST: host,
    NUXT_EDGEDB_PORT: port,
    NUXT_EDGEDB_USER: user,
    NUXT_EDGEDB_PASS: pass,
    NUXT_EDGEDB_DATABASE: database,
    NUXT_EDGEDB_TLS_CA: tlsCA,
    NUXT_EDGEDB_TLS_SECURITY: tlsSecurity,
    NUXT_EDGEDB_AUTH_BASE_URL: authBaseUrl = 'http://localhost:10702/db/edgedb/ext/auth/',
    NUXT_EDGEDB_OAUTH_CALLBACK: oAuthCallbackUrl = 'http://localhost:10702/db/edgedb/ext/auth/callback',
    NUXT_EDGEDB_AUTH_VERIFY_REDIRECT_URL: verifyRedirectUrl = 'http://localhost:3000/auth/verify',
    NUXT_EDGEDB_AUTH_RESET_PASSWORD_URL: resetPasswordUrl = 'http://localhost:3000/auth/reset-password',
    NUXT_EDGEDB_OAUTH_REDIRECT_URL: oAuthRedirectUrl = 'http://localhost:3000/auth/callback',
  } = process.env

  let dsn: string | undefined
  if (
    host
    && port
    && user
    && pass
    && database
  )
    dsn = `edgedb://${user}:${pass}@${host}:${port}/${database}`

  return {
    appUrl,
    authBaseUrl,
    resetPasswordUrl,
    verifyRedirectUrl,
    oAuthCallbackUrl,
    oAuthRedirectUrl,
    dsn,
    database,
    user,
    pass,
    host,
    port,
    tlsCA,
    tlsSecurity: tlsSecurity as 'insecure' | 'no_host_verification' | 'strict' | 'default',
  }
}
