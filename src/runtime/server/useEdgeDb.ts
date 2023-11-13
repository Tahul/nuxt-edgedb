import { getCookie } from 'h3'
import type { H3Event, EventHandlerRequest } from 'h3'
import { createClient } from 'edgedb'
import type { ConnectOptions } from 'edgedb'
import { useEdgeDbEnv } from './useEdgeDbEnv'

export function useEdgeDb(
  req: H3Event<EventHandlerRequest> | undefined = undefined,
  clientOptions: ConnectOptions = {},
) {
  const { dsn } = useEdgeDbEnv()

  if (dsn) { clientOptions.dsn = dsn }

  return createClient(clientOptions).withGlobals({
    "ext::auth::client_token": req ? getCookie(req, 'edgedb-auth-token') : undefined,
  })
}
