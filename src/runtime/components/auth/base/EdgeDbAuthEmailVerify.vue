<script setup lang="ts">
import { computed, ref } from 'vue'
import { navigateTo, useRouter } from '#imports'

const props = withDefaults(
  defineProps<{
    redirectTo?: string
    provider?: string
    checkOnSetup?: boolean
  }>(),
  {
    redirectTo: '/',
    provider: 'builtin::local_emailpassword',
    checkOnSetup: true,
  },
)

const loading = ref(false)
const success = ref()
const error = ref()
const verificationToken = computed(() => useRouter().currentRoute.value.query?.verification_token)

async function check(provider: string = props.provider) {
  loading.value = true
  try {
    const result = await $fetch(`/api/auth/verify?verification_token=${verificationToken.value}`, {
      method: 'POST',
      body: {
        provider,
      },
    })

    success.value = true

    if (props.redirectTo)
      setTimeout(async () => await navigateTo(props.redirectTo), 1)

    return result
  }
  catch (e) {
    error.value = e
  }
  finally {
    loading.value = false
  }
}

defineExpose({
  check,
  success,
  loading,
  error,
  verificationToken,
})

if (props.checkOnSetup)
  await check()
</script>

<template>
  <slot v-bind="{ loading, success, error, check, verificationToken }" />
</template>
