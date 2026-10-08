import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { rendering } from '@maveric/server'
import { compress } from 'hono/compress'
import { secureHeaders } from 'hono/secure-headers'

import manifest from '@app/ui/manifest'
import config from '@app/utils/config'

import statusController from './controller/status.controller.js'


const hono = new OpenAPIHono()
  .use(compress())
  .use(secureHeaders())
  .use(rendering({ manifest })) as OpenAPIHono

const api = hono
  .route('/status', statusController)

if (config.apiDocs) {
  api.get('/docs', swaggerUI({ url: '/docs.json' }))
  api.doc('/docs.json', {
    info: {
      title: config.appName,
      version: config.appVersion,
    },
    openapi: '3.0.4',
  })
}

api.onError((err, ctx) => {
  console.error(err)
  return ctx.text('Internal Server Error', 500)
})

export default api
