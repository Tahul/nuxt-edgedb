<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo, useEdgeDbIdentity } from '#imports'

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
const password = ref()
function updatePassword(value: string) {
  password.value = value
}
const loading = ref(false)
const error = ref()
const success = ref()

async function submit(provider: string = 'builtin::local_emailpassword') {
  loading.value = true
  error.value = undefined
  success.value = undefined
  try {
    const result = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        provider,
      },
    })

    const { update } = useEdgeDbIdentity()

    await update()

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
  email,
  updateEmail,
  password,
  updatePassword,
  submit,
  success,
  loading,
})
</script>

<template>
  <slot v-bind="{ email, updateEmail, password, updatePassword, submit, loading }" />
</template>
