import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import statusRequests from '../requests/status.requests.js'
import commonResponses from '../responses/common.responses.js'
import statusResponses from '../responses/status.responses.js'


const startTime = Date.now()

const statusController = new OpenAPIHono()

  .openapi(createRoute({
    method: 'get',
    path: '',
    responses: {
      200: {
        content: {
          'application/json': { schema: statusResponses.getStatus },
          'text/html': { schema: commonResponses.html },
        },
      },
    },
  }), async ctx =>
    ctx.json({
      uptime: Date.now() - startTime,
    }, 200))

  .openapi(createRoute({
    method: 'post',
    path: '/test',
    request: {
      body: {
        content: {
          'application/json': { schema: statusRequests.test },
        },
      },
    },
    responses: {
      403: {},
    },
  }), async ctx =>
    ctx.body(null, 403))

export default statusController
