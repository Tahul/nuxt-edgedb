import { defineEventHandler, deleteCookie, getCookie, setCookie } from 'h3'
import { useEdgeDbEnv } from '../../server/composables/useEdgeDbEnv'
import { useEdgeDb } from '../../server/composables/useEdgeDb'

export default defineEventHandler(async (event) => {
  const { auth } = useEdgeDbEnv()

  const token = getCookie(event, 'edgedb-auth-token')

  if (!token) {
    deleteCookie(event, 'edgedb-auth-token')
    return
  }

  const client = useEdgeDb(event)

  try {
    let identityTarget = await client.querySingle(`select global current_user;`)

    if (!identityTarget && token) {
      identityTarget = await client.query(`
      insert ${auth.identityModel} {
        name := '',
        identity := global ext::auth::ClientTokenIdentity
      }
    `)
    }

    return identityTarget
  }
  catch (err) {
    setCookie(
      event,
      'edgedb-auth-token',
      '',
      {
        httpOnly: true,
        path: '/',
        secure: true,
        sameSite: true,
        expires: new Date(0),
      },
    )
  }
})
