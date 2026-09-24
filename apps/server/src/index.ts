import { serve } from '@hono/node-server'
import api from '@app/api'
import config from '@app/utils/config'



serve({
  fetch: api.fetch,
  port: config.port,
}, info => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
