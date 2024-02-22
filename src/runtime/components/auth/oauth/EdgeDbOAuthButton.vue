<script lang="ts" setup>
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{ provider: string }>(),
  {
    provider: undefined,
  },
)

const loading = ref(false)
const error = ref()

async function redirect(provider: string = props.provider) {
  loading.value = true
  try {
    const redirectTo = await $fetch(`/api/auth/authorize?provider=${provider}`)

    if (redirectTo)
      window.location.href = redirectTo.redirect
  }
  catch (e) {
    error.value = e
  }
  finally {
    loading.value = false
  }
}

defineExpose({
  redirect,
  loading,
  error,
})
</script>

<template>
  <slot v-bind="{ redirect, loading, error }" />
</template>
