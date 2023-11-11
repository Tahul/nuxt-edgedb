<template>
  <div>
    Nuxt EdgeDB playground!

    <div>
      Blogposts:
      {{ data }}
    </div>

    <div>
      Add a new client:
      <input placeholder="thecompaniesapi.com">
      <button @click="submit">
        {{ loading ? 'Loading...' : 'Submit' }}
      </button>
    </div>

    <div v-if="error">
      {{ error }}
    </div>
  </div>
</template>

<script lang="ts" setup>
const loading = ref(false);
const error = ref("");
const clientInput = ref();

const { data, refresh } = await useAsyncData(
  'blogpost-index',
  () => $fetch('/api/blogpost')
)

const submit = async () => {
  loading.value = true
  error.value = ""
  try {
    await $fetch('/api/client/create', {
      query: {
        domain: clientInput.value
      }
    })
    await refresh()
  } catch (e: any) {
    console.log(e);
    error.value = e;
  }
  loading.value = false
}
</script>
