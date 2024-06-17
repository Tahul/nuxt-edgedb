import { H3Error, defineEventHandler, getRequestURL, sendError, setHeaders } from 'h3'
import { useEdgeDbEnv } from '../../server/composables/useEdgeDbEnv'
import { useEdgeDbPKCE } from '../../server/composables/useEdgeDbPKCE'

/**
 * Redirects OAuth requests to EdgeDB Auth OAuth authorize redirect
 * with the PKCE challenge, and saves PKCE verifier in an HttpOnly
 * cookie for later retrieval.
 *
 * @param {Request} req
 */
export default defineEventHandler(async (req) => {
  const { urls } = useEdgeDbEnv()
  const { authBaseUrl, oAuthRedirectUrl } = urls
  const requestUrl = getRequestURL(req)
  const provider = requestUrl.searchParams.get('provider')

  if (!provider) {
    const err = new H3Error('Must provide a \'provider\' value in search parameters')
    err.statusCode = 400
    return sendError(req, err)
  }

  const pkce = useEdgeDbPKCE()
  const redirectUrl = new URL('authorize', authBaseUrl)
  redirectUrl.searchParams.set('provider', provider)
  redirectUrl.searchParams.set('challenge', pkce.challenge)
  redirectUrl.searchParams.set('redirect_to', oAuthRedirectUrl!)

  setHeaders(
    req,
    {
      'Set-Cookie': `edgedb-pkce-verifier=${pkce.verifier}; HttpOnly; Path=/; Secure; SameSite=Strict`,
    },
  )

  return {
    redirect: redirectUrl,
  }
})
