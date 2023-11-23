import { H3Error, defineEventHandler, getCookie, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const authToken = getCookie(event, 'edgedb-auth-token')
  if (!authToken) {
    const err = new H3Error('Not logged in')
    err.statusCode = 401
    return err
  }

  setCookie(event, 'edgedb-auth-token', '', {
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: true,
    expires: new Date(0)
  })
})
