export default defineNitroPlugin((app) => {
  app.hooks.hook('edgedb:auth:callback', (data) => {
    console.log(data)
  })
})
