<script setup lang="ts">
import { useEdgeDbIdentity } from '../../../composables/useEdgeDbIdentity'

const props = withDefaults(
  defineProps<{
    redirectTo?: string
    logoutOnSetup?: boolean
  }>(),
  {
    redirectTo: '/',
    logoutOnSetup: true,
  },
)

async function logout(redirectTo: string = props.redirectTo) {
  const { logout: identityLogout } = useEdgeDbIdentity()
  await identityLogout(redirectTo)
}

if (props.logoutOnSetup)
  await logout()
</script>

<template>
  <slot v-bind="{ logout }" />
</template>
