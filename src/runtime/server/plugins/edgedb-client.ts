import { createClient } from 'edgedb'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import { useEdgeDbEnv } from '../'

export default defineNitroPlugin(() => {
  const { dsn, tlsSecurity, tlsCA } = useEdgeDbEnv()

  const client = createClient({
    dsn,
    tlsSecurity,
    tlsCA,
  })

  // @ts-expect-error - untyped global
  globalThis.__nuxt_edgedb_client__ = client
})
