import { z } from '@hono/zod-openapi'


const statusRequests = {

  test: z.object({
    b: z.literal('A'),
  }),
}

export default statusRequests
