import { defineEventHandler, getQuery, getRouterParams, H3Error } from 'h3'

export default defineEventHandler(async (req) => {
  const client = useEdgeDb()

  const blogposts = await client.query(`
    select BlogPost {
      title,
      description
    }
  `)

  console.log(blogposts)

  return blogposts
})
