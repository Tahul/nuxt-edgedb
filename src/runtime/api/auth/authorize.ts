import { H3Error, defineEventHandler, getRequestURL } from 'h3'
import { useEdgeDbEnv, useEdgeDbPKCE } from '../../server'

/**
 * Redirects OAuth requests to EdgeDB Auth OAuth authorize redirect
 * with the PKCE challenge, and saves PKCE verifier in an HttpOnly
 * cookie for later retrieval.
 *
 * @param {Request} req
 */
export default defineEventHandler(async (req) => {
  const { authBaseUrl, oAuthRedirectUrl } = useEdgeDbEnv()
  const requestUrl = getRequestURL(req)
  const provider = requestUrl.searchParams.get('provider')

  if (!provider) {
    const err = new H3Error('Must provide a \'provider\' value in search parameters')
    err.statusCode = 400
    return err
  }

  const pkce = useEdgeDbPKCE()
  const redirectUrl = new URL('authorize', authBaseUrl)
  redirectUrl.searchParams.set('provider', provider)
  redirectUrl.searchParams.set('challenge', pkce.challenge)
  redirectUrl.searchParams.set('redirect_to', oAuthRedirectUrl)

  setHeaders(req, {
    'Set-Cookie': `edgedb-pkce-verifier=${pkce.verifier}; HttpOnly; Path=/; Secure; SameSite=Strict`,
  })

  return {
    redirect: redirectUrl,
  }
})
