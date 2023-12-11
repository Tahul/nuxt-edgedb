import { defineEventHandler, getQuery, isMethod, readBody } from 'h3'
import { useEdgeDbQueries } from '#edgedb/server'
import type { BlogPost } from '#edgedb/interfaces'

export default defineEventHandler(async (req) => {
  const query = getQuery(req)
  const { insertBlogPost, allBlogPosts, deleteBlogPost, getBlogPost } = useEdgeDbQueries(req)

  if (isMethod(req, 'POST')) {
    const {
      title,
      description,
      content,
    } = await readBody(req)

    const blogPost = await insertBlogPost({
      blogpost_title: title,
      blogpost_description: description,
      blogpost_content: content,
    })

    return blogPost
  }

  if (isMethod(req, 'GET')) {
    if (query?.id) {
      const blogpost = await getBlogPost({ blogpost_id: query.id.toString() })
      return blogpost as BlogPost
    }

    return await allBlogPosts()
  }

  if (isMethod(req, 'DELETE') && query?.id) {
    await deleteBlogPost({ blogpost_id: query.id.toString() })
    return { deleted: query?.id }
  }
})
