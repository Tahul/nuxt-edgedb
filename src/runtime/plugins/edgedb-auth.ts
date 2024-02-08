import type { H3Event } from 'h3'
import { fetchWithEvent, getRequestURL } from 'h3'
import { defineNuxtPlugin, navigateTo, useCookie, useState } from 'nuxt/app'

export default defineNuxtPlugin(async (nuxtApp) => {
  const identity = useState<any>('edgedb-auth-identity', () => undefined)

  const cookie = useCookie('edgedb-auth-token')

  const updateIdentity = async (event?: H3Event) => {
    if (!process.server) {
      identity.value = await $fetch('/api/auth/identity')
      return
    }

    if (!cookie.value)
      return

    const req = getRequestURL(event)
    const url = `${req.protocol}//${req.host}/api/auth/identity`
    identity.value = await fetchWithEvent(event, url).then(r => r.json())
  }

  const isLoggedIn = computed(() => !!((identity as Ref<User>)?.value))

  const logout = async (redirectTo: string) => {
    await $fetch('/api/auth/logout')
    identity.value = undefined
    if (redirectTo)
      await navigateTo(redirectTo)
  }

  if (process.server) {
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
