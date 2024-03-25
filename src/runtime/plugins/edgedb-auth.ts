import type { H3Event } from 'h3'
import { fetchWithEvent, getRequestURL } from 'h3'
import { defineNuxtPlugin, navigateTo, useCookie, useState } from 'nuxt/app'
import { computed } from 'vue'

export default defineNuxtPlugin(async (nuxtApp) => {
  const identity = useState<any>('edgedb-auth-identity', () => undefined)

  const cookie = useCookie('edgedb-auth-token')

  const isLoggedIn = computed(() => !!((identity as Ref<User>)?.value))

  async function updateIdentity(event?: H3Event) {
    try {
      if (!import.meta.server) {
        identity.value = await $fetch('/api/auth/identity')
        return
      }

      const req = getRequestURL(event)
      const url = `${req.protocol}//${req.host}/api/auth/identity`

      const idRequest = await fetchWithEvent(event, url).then(r => r.json())

      if (identity) {
        identity.value = idRequest
      }
      else {
        identity.value = undefined
        await logout()
      }
    }
    catch (_) {
      //
    }
  }

  async function logout(redirectTo: string) {
    await $fetch('/api/auth/logout')
    identity.value = undefined
    cookie.value = ''
    if (redirectTo)
      await navigateTo(redirectTo)
  }

  if (import.meta.server) {
    const event = nuxtApp?.ssrContext?.event

    if (event)
      await updateIdentity(event)
  }

  return {
    provide: {
      edgeDbIsLoggedIn: isLoggedIn,
      edgeDbCookie: cookie,
      edgeDbIdentity: identity,
      edgeDbUpdateIdentity: updateIdentity,
      edgeDbLogout: logout,
    },
  }
})
