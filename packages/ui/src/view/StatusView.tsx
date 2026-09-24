import type { StatusResponses } from '@app/schema/responses/status'


const StatusView = async ({ uptime }: StatusResponses['getStatus']) => (
  <div>
    <strong>Uptime:</strong> {uptime} milliseconds
  </div>
)

export default StatusView
