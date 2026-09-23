import { z } from '@hono/zod-openapi'

const getStatus = z.object({
  uptime: z.number().describe('Server uptime in milliseconds')
}).openapi({
  example: {
    uptime: 38549267
  }
})

const statusResponses = {
  getStatus,
}

export default statusResponses