import './production.js'
import path from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'

import api from '@app/api'
import config from '@app/utils/config'


// the client build (runtime, views, public files) is located next to the server bundle
const clientDir = path.join(import.meta.dirname, 'client')

const app = new Hono()
  .use(serveStatic({ root: clientDir }))
  .route('/', api)

serve({
  fetch: app.fetch,
  port: config.port,
}, info => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
