import { defineEventHandler } from 'h3'
import { useEdgeDb } from '../../server/composables/useEdgeDb'

export default defineEventHandler(async () => {
  const client = useEdgeDb()

  const result = await client.query(`
    select cfg::Config.extensions[is ext::auth::AuthConfig].providers {
      name,
      [is ext::auth::OAuthProviderConfig].display_name,
    };
  `)

  return result
})
