import e from '#edgedb/builder'

export type EdgeDbQueryBuilder = typeof e

export function useEdgeDbQueryBuilder(): EdgeDbQueryBuilder {
  return e
}
