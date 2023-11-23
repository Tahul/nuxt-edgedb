import { H3Error, defineEventHandler, readBody, setHeaders } from 'h3'
import { useEdgeDbEnv, useEdgeDbPKCE } from '../../server'

/**
 * Request a password reset for an email.
 *
 * @param {Request} req
 */
export default defineEventHandler(async (req) => {
  const pkce = useEdgeDbPKCE()
  const { authBaseUrl, resetPasswordUrl: reset_url } = useEdgeDbEnv()

  const { email } = await readBody(req)
  const provider = 'builtin::local_emailpassword'

  if (!email) {
    const err = new H3Error(`Request body is missing 'email'`)
    err.statusCode = 400
    return err
  }

  const sendResetUrl = new URL('send-reset-email', authBaseUrl)
  const sendResetResponse = await fetch(sendResetUrl.href, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      provider,
      reset_url,
      challenge: pkce.challenge,
    }),
  })

  if (!sendResetResponse.ok) {
    const err = new H3Error(await sendResetResponse.text())
    err.statusCode = 400
    return err
  }

  const { email_sent } = await sendResetResponse.json()

  setHeaders(req, {
    'Set-Cookie': `edgedb-pkce-verifier=${pkce.verifier}; HttpOnly; Path=/; Secure; SameSite=Strict`,
  })

  return {
    message: `Reset email sent to '${email_sent}'.`,
  }
})
