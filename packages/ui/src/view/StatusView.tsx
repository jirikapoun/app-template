import { view } from '@maveric/client'

import type statusResponses from '@app/schema/responses/status'


const StatusView = view<typeof statusResponses.getStatus>(import.meta.url, ({ uptime }) => (
  <div>
    <strong>Uptime:</strong> {uptime} milliseconds
  </div>
))

export default StatusView
