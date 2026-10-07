import { createElement } from 'react'
import { hydrateRoot } from 'react-dom/client'

import { PAYLOAD_ELEMENT_ID } from './index.js'

import type { Payload, View } from './index.js'


const payloadElement = document.getElementById(PAYLOAD_ELEMENT_ID)
if (!payloadElement?.textContent) {
  throw new Error(`Element #${PAYLOAD_ELEMENT_ID} with the hydration payload not found`)
}

const { view, props } = JSON.parse(payloadElement.textContent) as Payload
// eslint-disable-next-line no-inline-comments
const { default: viewComponent } = await import(/* @vite-ignore */ view) as { default: View<object> }

// views render the whole document, so the whole document is hydrated
hydrateRoot(document, createElement(viewComponent, props as object))
