import { createClient } from 'edgedb'
import { defineNitroPlugin } from 'nitropack/dist/runtime/plugin'
import { useEdgeDbEnv } from '../'

export default defineNitroPlugin(() => {
  const { dsn } = useEdgeDbEnv()

  const client = createClient({
    dsn: dsn.full,
    tlsSecurity: dsn.tlsSecurity,
    tlsCA: dsn.tlsCA,
  })

  globalThis.__nuxt_edgedb_client__ = client
})
