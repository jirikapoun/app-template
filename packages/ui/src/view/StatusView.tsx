import { view } from '@maveric/client'

import App from '../App.js'

import type statusResponses from '@app/schema/responses/status'


const StatusView = view<typeof statusResponses.getStatus>(({ uptime }) => (
  <App title="Status">
    <div>
      <strong>Uptime:</strong> {uptime} milliseconds
    </div>
  </App>
))

export default StatusView
