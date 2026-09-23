import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import statusController from './controller/status.controller.js'


const server = new OpenAPIHono()
  .route('/status', statusController)

server.get('/docs', swaggerUI({ url: '/openapi' }))
server.doc('/openapi', {
  // TODO fill out openapi info
  info: {
    title: '',
    version: '',
  },
  openapi: '3.0.4',
})

export default server
