import { defineEventHandler, getQuery } from 'h3'
import { useEdgeDbEnv } from '../../server/composables/useEdgeDbEnv'

/**
 * Render a simple reset password UI
 *
 * @param {Request} req
 */
export default defineEventHandler((req) => {
  const { urls } = useEdgeDbEnv()
  const { authBaseUrl } = urls
  const { reset_token } = getQuery(req)

  return {
    headers: { 'Content-Type': 'text/html' },
    body: `
      <html>
        <body>
          <form method="POST" action="${authBaseUrl}/reset-password">
            <input type="hidden" name="reset_token" value="${reset_token}">
            <label>
              New password:
              <input type="password" name="password" required>
            </label>
            <button type="submit">Reset Password</button>
          </form>
        </body>
      </html>
    `,
  }
})
