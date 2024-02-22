import { H3Error, defineEventHandler, getCookie, sendError, setCookie } from 'h3'

export default defineEventHandler(async (req) => {
  const authToken = getCookie(req, 'edgedb-auth-token')

  if (!authToken) {
    const err = new H3Error('Not logged in')
    err.statusCode = 401
    return sendError(req, err)
  }

  setCookie(
    req,
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
})
