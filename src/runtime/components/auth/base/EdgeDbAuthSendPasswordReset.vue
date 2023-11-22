<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#imports'

const props = withDefaults(
  defineProps<{ redirectTo?: string }>(),
  {
    redirectTo: '/',
  },
)

const email = ref()
function updateEmail(value: string) {
  email.value = value
}
const error = ref()
const success = ref()
const message = ref()
const loading = ref(false)

async function submit() {
  error.value = undefined
  success.value = undefined
  loading.value = true
  try {
    const result = await $fetch<any>('/api/auth/send-password-reset-email', {
      method: 'POST',
      body: {
        email: email.value,
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
  email,
  updateEmail,
  submit,
  error,
  success,
  message,
  loading,
})
</script>

<template>
  <slot v-bind="{ email, updateEmail, submit, error, success, message, loading }" />
</template>
