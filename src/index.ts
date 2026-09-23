import { serve } from '@hono/node-server'
import server from './api/server.js'


serve({
  fetch: server.fetch,
  port: 3000,
}, info => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
