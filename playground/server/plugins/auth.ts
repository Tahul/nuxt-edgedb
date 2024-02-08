export default defineNitroPlugin((app) => {
  app.hooks.hook('edgedb:auth:callback', (_) => {
    // console.log(_)
  })
})
