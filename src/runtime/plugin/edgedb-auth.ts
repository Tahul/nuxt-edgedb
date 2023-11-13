import type { H3Event } from 'h3'
import { fetchWithEvent, getRequestURL } from 'h3'
import { defineNuxtPlugin, useState, useCookie, navigateTo } from 'nuxt/app'

export default defineNuxtPlugin(async (nuxtApp) => {
  const identity = useState<any>('edgedb-auth-identity', () => undefined)

  const cookie = useCookie('edgedb-auth-token')

  const updateIdentity = async (event?: H3Event) => {
    if (!cookie.value) { return }
    if (process.server && event) {
      const req = getRequestURL(event)
      const url = req.protocol + '//' + req.host + '/api/auth/identity'
      identity.value = await fetchWithEvent(event, url).then(r => r.json())
      return
    }
    identity.value = await $fetch('/api/auth/identity')
  }

  const logout = async (redirectTo: string) => {
    cookie.value = undefined
    identity.value = undefined
    if (redirectTo) { await navigateTo(redirectTo) }
  }

  if (process.server) {
    const event = nuxtApp?.ssrContext?.event
    if (event) await updateIdentity(event)
  }

  return {
    provide: {
      edgeDbCookie: cookie,
      edgeDbIdentity: identity,
      edgeDbUpdateIdentity: updateIdentity,
      edgeDbLogout: logout
    }
  }
})
