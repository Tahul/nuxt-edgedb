import { defineEventHandler, getQuery, getRouterParams, H3Error } from 'h3'

export default defineEventHandler(async (req) => {
  const params = getRouterParams(req)
  const query = getQuery(req)
  // const db = useEdgeDb()

  if (query.domain) {
    //
  } else {
    const err = new H3Error('No domain found in query.')
    err.statusCode = 400
    return err
  }
})
