<script setup lang="ts">
import { computed, ref } from 'vue'
import { navigateTo, useRouter } from '#imports'

const props = withDefaults(
  defineProps<{ redirectTo?: string }>(),
  {
    redirectTo: '/',
  },
)

const resetToken = computed(() => useRouter().currentRoute.value.params?.resetToken)
const password = ref()
function updatePassword(value: string) {
  password.value = value
}
const error = ref()
const success = ref()
const message = ref()
const loading = ref(false)

async function submit(provider: string = 'builtin::local_emailpassword') {
  error.value = undefined
  success.value = undefined
  loading.value = true
  try {
    const result = await $fetch<any>('/api/auth/reset-password', {
      method: 'POST',
      body: {
        password: password.value,
        reset_token: resetToken.value,
        provider,
      },
    })

    if (result?.message)
      message.value = result?.message

    if (props.redirectTo)
      setTimeout(async () => await navigateTo(props.redirectTo), 1)

    success.value = true

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
  password,
  updatePassword,
  submit,
  error,
  success,
  message,
  resetToken,
  loading,
})
</script>

<template>
  <slot v-bind="{ password, updatePassword, submit, error, success, message, resetToken, loading }" />
</template>
