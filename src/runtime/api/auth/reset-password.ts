import { H3Error, defineEventHandler, getCookie, readBody, sendError, setHeaders } from 'h3'
import { useEdgeDbEnv } from '../../server/composables/useEdgeDbEnv'

/**
 * Send new password with reset token to EdgeDB Auth.
 *
 * @param {Request} req
 */
export default defineEventHandler(async (req) => {
  const { urls } = useEdgeDbEnv()
  const { authBaseUrl } = urls
  const { reset_token, password } = await readBody(req)

  if (!reset_token || !password) {
    const err = new H3Error(`Request body malformed. Expected JSON body with 'reset_token' and 'password' keys.`)
    err.statusCode = 400
    return sendError(req, err)
  }

  const provider = 'builtin::local_emailpassword'
  const verifier = getCookie(req, 'edgedb-pkce-verifier')
  if (!verifier) {
    const err = new H3Error(`Could not find 'verifier' in the cookie store. Is this the same user agent/browser that started the authorization flow?`)
    err.statusCode = 400
    return sendError(req, err)
  }

  const resetUrl = new URL('reset-password', authBaseUrl)
  const resetResponse = await fetch(resetUrl.href, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reset_token,
      provider,
      password,
    }),
  })

  if (!resetResponse.ok) {
    const err = new H3Error(await resetResponse.text())
    err.statusCode = 400
    return sendError(req, err)
  }

  const { code } = await resetResponse.json()
  const tokenUrl = new URL('token', authBaseUrl)
  tokenUrl.searchParams.set('code', code)
  tokenUrl.searchParams.set('verifier', verifier)
  const tokenResponse = await fetch(tokenUrl.href, {
    method: 'get',
  })

  if (!tokenResponse.ok) {
    const err = new H3Error(await tokenResponse.text())
    err.statusCode = 400
    return sendError(req, err)
  }

  const tokenResponseData = await tokenResponse.json()
  setHeaders(req, {
    'Set-Cookie': `edgedb-auth-token=${tokenResponseData.auth_token}; HttpOnly; Path=/; Secure; SameSite=Strict`,
  })

  return tokenResponseData
})
