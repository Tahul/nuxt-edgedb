import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { H3Event } from 'h3'
import { useNuxtApp } from '#imports'
import type { User } from '@db/interfaces'

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
    $edgeDbLogout: logout
  } = useNuxtApp()

  const identityData = {
    isLoggedIn: computed(() => !!((identity as Ref<User>)?.value)),
    identity,
    cookie,
    update,
    logout
  } as UseEdgeDbIdentityData

  return identityData
}
