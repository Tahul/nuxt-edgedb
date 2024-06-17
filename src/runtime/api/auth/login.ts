import { H3Error, defineEventHandler, readBody, sendError, setCookie } from 'h3'
import { useEdgeDbEnv } from '../../server/composables/useEdgeDbEnv'
import { useEdgeDbPKCE } from '../../server/composables/useEdgeDbPKCE'

export default defineEventHandler(async (req) => {
  const pkce = useEdgeDbPKCE()
  const { urls } = useEdgeDbEnv()
  const { authBaseUrl } = urls

  const { email, password, provider } = await readBody(req)

  if (!email || !password || !provider) {
    const err = new H3Error(`Request body malformed. Expected JSON body with 'email', 'password', and 'provider' keys, but got: ${Object.entries({ email, password, provider }).filter(([, v]) => !!v)}`)
    err.statusCode = 400
    return sendError(req, err)
  }

  const authenticateUrl = new URL('authenticate', authBaseUrl)
  const authenticateResponse = await fetch(authenticateUrl.href, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      challenge: pkce.challenge,
      email,
      password,
      provider,
    }),
  })

  if (!authenticateResponse.ok) {
    const err = new H3Error(await authenticateResponse.text())
    err.statusCode = 400
    return sendError(req, err)
  }

  const authenticateResponseData = await authenticateResponse.json()

  const tokenUrl = new URL('token', authBaseUrl)
  tokenUrl.searchParams.set('code', authenticateResponseData.code)
  tokenUrl.searchParams.set('verifier', pkce.verifier)
  const tokenResponse = await fetch(tokenUrl.href, {
    method: 'get',
  })

  if (!tokenResponse.ok) {
    const err = new H3Error(await tokenResponse.text())
    err.statusCode = 400
    return sendError(req, err)
  }

  const tokenResponseData = await tokenResponse.json()

  setCookie(req, 'edgedb-auth-token', tokenResponseData.auth_token, {
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: true,
  })

  return tokenResponseData
})
