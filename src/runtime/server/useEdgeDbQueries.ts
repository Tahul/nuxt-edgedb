import type { EventHandlerRequest, H3Event } from 'h3'
import { useEdgeDb } from './useEdgeDb'
import * as queries from '#db/queries'

export function useEdgeDbQueries(
  req: H3Event<EventHandlerRequest> | undefined = undefined,
) {
  const client = useEdgeDb(req)

  return Object.fromEntries(
    Object.entries(queries).map(([key, fn]) => {
      return [
        key,
        (args?: Parameters<typeof fn>[1]) => fn(client, args),
      ]
    }),
  )
}
