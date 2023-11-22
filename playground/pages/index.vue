<script setup lang="ts">
import type { BlogPost } from '#edgedb/interfaces'

const { isLoggedIn } = useEdgeDbIdentity()

const { data, refresh } = await useAsyncData<BlogPost[]>(
  'blogpost-index',
  async () => await $fetch('/api/blogpost'),
)

async function deleteBlogPost(id: string) {
  await $fetch('/api/blogpost', {
    method: 'DELETE',
    body: {
      id,
    },
  })
  await refresh()
}
</script>

<template>
  <UContainer class="p-8 flex flex-col gap-4">
    <UCard
      v-for="blogpost of data"
      :key="blogpost.id"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h2>{{ blogpost.title }}</h2>
          <div
            v-if="isLoggedIn"
            class="cursor-pointer"
            @click="() => deleteBlogPost(blogpost.id)"
          >
            <UIcon name="i-heroicons-trash" />
          </div>
        </div>
      </template>

      <p>{{ blogpost.description }}</p>

      <template #footer>
        <NuxtLink :to="`/blogposts/${blogpost.id}`">
          Read more
        </NuxtLink>
      </template>
    </UCard>
  </UContainer>
</template>
