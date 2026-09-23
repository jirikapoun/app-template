import {z} from "@hono/zod-openapi";

const html = z.string().describe('Rendered HTML page').openapi({
  example: '<html><body><h1>Hello World</h1></body></html>'
})

const commonResponses = {
  html
}

export default commonResponses
