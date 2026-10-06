import { z } from '@hono/zod-openapi'


const statusResponses = {

  getStatus: z.object({
    uptime: z.number().describe('Server uptime in milliseconds'),
  }).openapi({
    example: {
      uptime: 38549267,
    },
  }),
}

export default statusResponses
