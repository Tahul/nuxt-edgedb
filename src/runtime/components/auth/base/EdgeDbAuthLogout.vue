<template>
  <slot v-bind="{ logout }" />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    redirectTo?: string
    logoutOnSetup?: boolean
  }>(),
  {
    redirectTo: '/',
    logoutOnSetup: true
  }
)

const logout = async (redirectTo: string = props.redirectTo) => {
  const { logout: identityLogout } = useEdgeDbIdentity()
  await identityLogout(redirectTo)
}

if (props.logoutOnSetup) { await logout() }
</script>
