import { defineEventHandler, deleteCookie, getCookie } from 'h3'
import { useEdgeDb } from '../../server'

export default defineEventHandler(async (req) => {
  const token = getCookie(req, 'edgedb-auth-token')

  if (!token) {
    deleteCookie(req, 'edgedb-auth-token')
    return
  }

  const client = useEdgeDb(req)

  return await client.querySingle(`select global current_user;`)
})
