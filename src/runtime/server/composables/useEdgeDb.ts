import { getCookie } from 'h3'
import type { EventHandlerRequest, H3Event } from 'h3'
import type { Client } from 'edgedb'

export function useEdgeDb(req: H3Event<EventHandlerRequest> | undefined = undefined) {
  // @ts-expect-error - untyped global
  const client = globalThis.__nuxt_edgedb_client__ as Client

  if (req) {
    return client.withGlobals({
      'ext::auth::client_token': req ? getCookie(req, 'edgedb-auth-token') : undefined,
    })
  }

  return client
}
