import { serve } from '@hono/node-server'
import server from './api/server.js'
import config from './config.js'


serve({
  fetch: server.fetch,
  port: config.port,
}, info => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
