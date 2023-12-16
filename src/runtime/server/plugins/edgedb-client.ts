import { createClient } from 'edgedb'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import { useEdgeDbEnv } from '../'

export default defineNitroPlugin(() => {
  const { dsn } = useEdgeDbEnv()

  const client = createClient({ dsn })

  // @ts-expect-error - untyped global
  globalThis.__nuxt_edgedb_client__ = client
})
