import { defineEventHandler, isMethod, readBody } from 'h3'
import { useEdgeDbQueries } from '#edgedb/server'

export default defineEventHandler(async (req) => {
  if (isMethod(req, 'POST')) {
    const {
      title,
      description,
      content,
    } = await readBody(req)

    const { insertBlogPost } = useEdgeDbQueries(req)

    const blogPost = await insertBlogPost({
      blogpost_title: title,
      blogpost_description: description,
      blogpost_content: content,

    })

    return blogPost
  }
})
