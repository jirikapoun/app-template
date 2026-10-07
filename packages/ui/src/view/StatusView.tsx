import { view } from '@maveric/client'
import { useEffect, useState } from 'react'

import App from '../App.js'

import type statusResponses from '@app/schema/responses/status'


const StatusView = view<typeof statusResponses.getStatus>(({ uptime }) => {
  // the uptime keeps counting in the browser, starting from the last value received from the server
  const [lastUpdate, setLastUpdate] = useState(() => ({ uptime, receivedAt: Date.now() }))
  if (lastUpdate.uptime !== uptime) {
    setLastUpdate({ uptime, receivedAt: Date.now() })
  }

  const [now, setNow] = useState(lastUpdate.receivedAt)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const currentUptime = lastUpdate.uptime + Math.max(0, now - lastUpdate.receivedAt)

  return (
    <App title="Status">
      <div>
        <strong>Uptime:</strong> {currentUptime} milliseconds
      </div>
    </App>
  )
})

export default StatusView
