import { defineEventHandler, isMethod, readBody } from 'h3'

export default defineEventHandler(async (req) => {
  if (isMethod(req, 'DELETE')) {
    const { id } = await readBody(req)

    const { deleteBlogPost } = useEdgeDbQueries(req)

    return await deleteBlogPost({ blogpost_id: id })
  }
  if (isMethod(req, 'POST')) {
    const {
      title,
      description,
      content
    } = await readBody(req)

    const { insertBlogPost } = useEdgeDbQueries(req)

    const blogPost = await insertBlogPost({
        blogpost_title: title,
        blogpost_description: description,
        blogpost_content: content,
      })

    return blogPost
  }

  const { allBlogPosts } = useEdgeDbQueries()

  return await allBlogPosts()
})
