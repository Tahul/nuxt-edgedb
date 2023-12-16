export default defineNitroPlugin((app) => {
  // @ts-expect-error - untyped hook
  app.hooks.hook('edgedb:auth:callback', (data) => {
    console.log(data)
  })
})
