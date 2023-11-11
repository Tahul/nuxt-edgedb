import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const client = useEdgeDb()

  const blogposts = await client.query(`
    select BlogPost {
      title,
      description
    }
  `)

  return blogposts
})
