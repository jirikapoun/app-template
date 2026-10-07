import { Controller, route } from '@maveric/server'

import statusRequests from '@app/schema/requests/status'
import statusResponses from '@app/schema/responses/status'
import StatusView from '@app/ui/view/StatusView'


const startTime = Date.now()

const statusController = new Controller()

  .endpoint(route({
    method: 'get',
    path: '',
    responses: {
      200: {
        schema: statusResponses.getStatus,
        view: StatusView,
      },
    },
  }), async ctx =>
    ctx.render({
      uptime: Date.now() - startTime,
    }, 200))

  .endpoint(route({
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
      403: {
        summary: 'Forbidden',
        description: 'You shall not pass',
      },
    },
  }), async ctx =>
    ctx.body(null, 403))

export default statusController
