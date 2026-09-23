import { z } from '@hono/zod-openapi'


const commonResponses = {

  html: z.string().describe('Rendered HTML page').openapi({
    example: '<html><body><h1>Hello World</h1></body></html>',
  }),
}

export default commonResponses
