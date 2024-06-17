import { H3Error, defineEventHandler, readBody, sendError, setHeaders } from 'h3'
import { useEdgeDbEnv } from '../../server/composables/useEdgeDbEnv'
import { useEdgeDbPKCE } from '../../server/composables/useEdgeDbPKCE'

/**
 * Handles sign up with email and password.
 *
 * @param {Request} req
 * @param {Response} res
 */
export default defineEventHandler(async (req) => {
  const pkce = useEdgeDbPKCE()
  const { urls } = useEdgeDbEnv()
  const { authBaseUrl, verifyRedirectUrl } = urls

  const { email, password, provider } = await readBody(req)

  if (!email || !password || !provider) {
    const err = new H3Error(`Request body malformed. Expected JSON body with 'email', 'password', and 'provider' keys, but got: ${Object.entries({ email, password, provider }).filter(([, v]) => !!v)}`)
    err.statusCode = 400
    return sendError(req, err)
  }

  const registerUrl = new URL('register', authBaseUrl)
  const registerResponse = await fetch(registerUrl.href, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      challenge: pkce.challenge,
      email,
      provider,
      password,
      verify_url: verifyRedirectUrl,
    }),
  })

  if (!registerResponse.ok) {
    const err = new H3Error(`Error from auth server: ${await registerResponse.text()}`)
    err.statusCode = 400
    return sendError(req, err)
  }

  const registerResponseData = await registerResponse.json()

  setHeaders(req, {
    'Set-Cookie': `edgedb-pkce-verifier=${pkce.verifier}; HttpOnly; Path=/; Secure; SameSite=Strict`,
  })

  return registerResponseData
})
