import { defineEventHandler, deleteCookie, getCookie } from 'h3'
import { useEdgeDb, useEdgeDbEnv } from '../../server'

export default defineEventHandler(async (req) => {
  const { identityModel } = useEdgeDbEnv()

  const token = getCookie(req, 'edgedb-auth-token')

  if (!token) {
    deleteCookie(req, 'edgedb-auth-token')
    return
  }

  const client = useEdgeDb(req)

  let identityTarget = await client.querySingle(`select global current_user;`)

  if (!identityTarget && token) {
    identityTarget = await client.query(`
      insert ${identityModel} {
        name := '',
        identity := global ext::auth::ClientTokenIdentity
      }
    `)
  }

  return identityTarget
})
