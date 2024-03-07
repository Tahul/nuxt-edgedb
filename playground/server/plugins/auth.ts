export default defineNitroPlugin((app) => {
  app.hooks.hook(
    'edgedb:auth:callback' as any,
    () => {
      console.log('auth callback!')
    },
  )
})
