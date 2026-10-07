import { view } from '@maveric/client'
import { useEffect, useState } from 'react'

import App from '../App.js'

import type statusResponses from '@app/schema/responses/status'


const StatusView = view<typeof statusResponses.getStatus>(({ uptime }) => {
  // keeps counting in the browser once the view is hydrated
  const [currentUptime, setCurrentUptime] = useState(uptime)
  useEffect(() => {
    const startTime = Date.now() - uptime
    const interval = setInterval(() => setCurrentUptime(Date.now() - startTime), 1000)
    return () => clearInterval(interval)
  }, [uptime])

  return (
    <App title="Status">
      <div>
        <strong>Uptime:</strong> {currentUptime} milliseconds
      </div>
    </App>
  )
})

export default StatusView
