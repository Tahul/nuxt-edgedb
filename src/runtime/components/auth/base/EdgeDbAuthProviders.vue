<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAsyncData } from '#imports'

const providers = ref<{ name: string, display_name: string }[]>([])
const oAuthProviders = computed(() => {
  return providers.value.filter(p => p?.name?.includes('oauth_'))
})
const loading = ref(false)
const error = ref()

async function getProviders() {
  loading.value = true
  try {
    providers.value = await $fetch(`/api/auth/providers`)
    return providers.value
  }
  catch (e) {
    error.value = e
  }
  finally {
    loading.value = false
  }
}

defineExpose({
  providers,
  oAuthProviders,
  getProviders,
  loading,
  error,
})

await useAsyncData(
  'edgedb-oauth-providers',
  async () => await getProviders(),
)
</script>

<template>
  <slot v-bind="{ providers, oAuthProviders, getProviders, loading, error }" />
</template>
