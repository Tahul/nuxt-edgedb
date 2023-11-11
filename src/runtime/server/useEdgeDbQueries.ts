import * as queries from '@db/queries'

export function useEdgeDbQueries() {
  const client = useEdgeDb()

  return Object.fromEntries(
    Object.entries(queries).map(([key, fn]) => {
      return [
        key,
        (...args) => fn(client, ...args)
      ]
    })
  )
}
