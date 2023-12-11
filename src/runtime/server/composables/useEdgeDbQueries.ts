import type { EventHandlerRequest, H3Event } from 'h3'
import { useEdgeDb } from './useEdgeDb'
import * as queries from '#edgedb/queries'

export type EdgeDbQueries = keyof typeof queries

export function useEdgeDbQueries(
  req: H3Event<EventHandlerRequest> | undefined = undefined,
): { [K in EdgeDbQueries]: (arg?: Parameters<typeof queries[K]>[1]) => ReturnType<typeof queries[K]> } {
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
