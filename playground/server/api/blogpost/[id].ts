import { defineEventHandler, getRouterParams, H3Error } from 'h3'

export default defineEventHandler(async (req) => {
  const params = getRouterParams(req)
  const client = useEdgeDb()

  if (params.id) {
    const blogpost = await client.querySingle(`
      select BlogPost {
        title,
        description
      } filter .id = ${params.id}
    `)

    return blogpost
  } else {
    const err = new H3Error('No domain found in query.')
    err.statusCode = 400
    return err
  }
})
