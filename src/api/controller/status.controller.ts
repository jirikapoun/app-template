import StatusView from '../../ui/view/StatusView.js'
import statusRequests from '../requests/status.requests.js'
import statusResponses from '../responses/status.responses.js'
import Controller, { createRoute } from './common.js'


const startTime = Date.now()

const statusController = new Controller()

  .endpoint(createRoute({
    method: 'get',
    path: '',
    responses: {
      200: {
        schema: statusResponses.getStatus,
        view: StatusView,
      },
    },
  }), async ctx =>
    ctx.json({
      uptime: Date.now() - startTime,
    }, 200))

  .endpoint(createRoute({
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
