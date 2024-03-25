import { useRuntimeConfig } from '#imports'

export function useEdgeDbEnv() {
  const { edgeDb } = useRuntimeConfig()

  return edgeDb
}
