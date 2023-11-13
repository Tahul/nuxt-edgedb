export default defineNuxtConfig({
  modules: [
    '../src/module'
  ],
  edgeDb: {
    auth: true,
    oauth: true
  },
  devtools: { enabled: true }
})
