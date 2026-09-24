import type { StatusResponses } from '../../api/responses/status.responses.js'


const StatusView = async ({ uptime }: StatusResponses['getStatus']) => (
  <div>
    <strong>Uptime:</strong> {uptime} milliseconds
  </div>
)

export default StatusView
