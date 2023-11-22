export default defineNuxtConfig({
  modules: [
    '../src/module',
    '@nuxt/ui',
  ],
  edgeDb: {
    auth: true,
    oauth: true,
  },
  devtools: { enabled: true },
  tailwindcss: {
    viewer: false,
  },
})
