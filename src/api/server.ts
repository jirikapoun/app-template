import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import config from '../config.js'
import statusController from './controller/status.controller.js'


const server = new OpenAPIHono()
  .route('/status', statusController)

if (config.apiDocs) {
  server.get('/docs', swaggerUI({ url: '/docs.json' }))
  server.doc('/docs.json', {
    info: {
      title: config.appName,
      version: config.appVersion,
    },
    openapi: '3.0.4',
  })
}

export default server
