import { createClient } from 'edgedb'

export function useEdgeDb() {
  const client = createClient()

  return client
}
