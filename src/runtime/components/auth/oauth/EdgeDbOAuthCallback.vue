<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEdgeDbIdentity } from '../../../composables/useEdgeDbIdentity'
import { navigateTo, useRouter } from '#imports'

const props = withDefaults(
  defineProps<{
    redirectTo?: string
    checkOnSetup?: boolean
  }>(),
  {
    redirectTo: '/',
    checkOnSetup: true,
  },
)

const loading = ref(false)
const success = ref()
const error = ref()
const code = computed(() => useRouter().currentRoute.value.query?.code)

async function check() {
  loading.value = true
  try {
    const result = await $fetch(`/api/auth/callback?code=${code.value}`, {
      method: 'POST',
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
  check,
  success,
  loading,
  error,
  code,
})

if (props.checkOnSetup)
  await check()
</script>

<template>
  <slot v-bind="{ loading, success, error, check, code }" />
</template>
