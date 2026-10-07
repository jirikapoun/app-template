import { createElement } from 'react'
import { hydrateRoot } from 'react-dom/client'

import { HMR_EVENTS, PAYLOAD_ELEMENT_ID } from './index.js'

import type { Payload, View } from './index.js'


const readPayload = (source: Document) => {
  const payloadElement = source.getElementById(PAYLOAD_ELEMENT_ID)
  if (!payloadElement?.textContent) {
    throw new Error(`Element #${PAYLOAD_ELEMENT_ID} with the hydration payload not found`)
  }
  return JSON.parse(payloadElement.textContent) as Payload
}

const { view, props } = readPayload(document)
// eslint-disable-next-line no-inline-comments
const { default: viewComponent } = await import(/* @vite-ignore */ view) as { default: View<object> }

// views render the whole document, so the whole document is hydrated
const root = hydrateRoot(document, createElement(viewComponent, props as object))

// in dev, the view and the modules it imports are updated by Fast Refresh, while changes of modules used only
// on the server (controllers, schemas, ...) re-render the view with fresh props instead of reloading the page
if (import.meta.hot) {
  const refreshProps = async () => {
    const response = await fetch(location.href, { headers: { accept: 'text/html' } })
    const nextPayload = readPayload(new DOMParser().parseFromString(await response.text(), 'text/html'))
    if (nextPayload.view === view) {
      root.render(createElement(viewComponent, nextPayload.props as object))
    } else {
      location.reload()
    }
  }
  import.meta.hot.on(HMR_EVENTS.serverUpdate, () => {
    // e.g. an error page without the payload
    refreshProps().catch(() => location.reload())
  })
  import.meta.hot.send(HMR_EVENTS.hydrated)
}
