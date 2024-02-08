import type { ComputedRef, Ref } from 'vue'
import type { H3Event } from 'h3'
import type { User } from '#edgedb/interfaces'
import { useNuxtApp } from '#imports'

interface UseEdgeDbIdentityData {
  identity: Ref<User>
  cookie: Ref<string>
  update: (event?: H3Event) => Promise<void>
  logout: (redirectTo?: string) => Promise<void>
  isLoggedIn: ComputedRef<boolean>
}

export function useEdgeDbIdentity(): UseEdgeDbIdentityData {
  const {
    $edgeDbIdentity: identity,
    $edgeDbCookie: cookie,
    $edgeDbUpdateIdentity: update,
    $edgeDbLogout: logout,
    $edgeDbIsLoggedIn: isLoggedIn,
  } = useNuxtApp()

  const identityData = {
    isLoggedIn,
    identity,
    cookie,
    update,
    logout,
  } as UseEdgeDbIdentityData

  return identityData
}
