import { defineEventHandler, getRouterParams, H3Error } from 'h3'
import { BlogPost } from '@db/interfaces'

export default defineEventHandler(async (req) => {
  const params = getRouterParams(req)
  const client = useEdgeDb(req)

  if (params.id) {
    const blogpost = await client.querySingle(`
      select BlogPost {
        title,
        description,
        content,
      } filter .id = <uuid>$blogpost_id
    `, { blogpost_id: params.id })

    return blogpost as BlogPost
  } else {
    const err = new H3Error('No domain found in query.')
    err.statusCode = 400
    return err
  }
})
