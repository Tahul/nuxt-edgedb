import { defineEventHandler, getCookie, deleteCookie } from "h3";

export default defineEventHandler(async (req) => {
  const token = getCookie(req, 'edgedb-auth-token')

  if (!token) {
    deleteCookie(req, 'edgedb-auth-token')
    return
  }

  const client = useEdgeDb(req)

  let user = await client.querySingle(`select global current_user;`);

  if (!user && token) {
    user = await client.query(`
      insert User {
        name := '',
        identity := global ext::auth::ClientTokenIdentity
      }
    `)
  }

  return user;
});
