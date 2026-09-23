import {z} from "@hono/zod-openapi";

const test = z.object({
  b: z.literal('A')
})

const statusRequests = {
  test
}

export default statusRequests