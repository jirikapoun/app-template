import { PAYLOAD_ELEMENT_ID } from '@maveric/client'
import { accepts } from 'hono/accepts'
import { createMiddleware } from 'hono/factory'
import { matchedRoutes } from 'hono/route'
import { COMPOSED_HANDLER } from 'hono/utils/constants'
import React from 'react'
import { renderToString } from 'react-dom/server'

import type { ClientEntry, ClientManifest, Payload } from '@maveric/client'
import type { TypedResponse } from 'hono'
import type { RouterRoute } from 'hono/types'
import type { ResponseHeader } from 'hono/utils/headers'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { BaseMime } from 'hono/utils/mime'
import type { InvalidJSONValue, JSONParsed, JSONValue } from 'hono/utils/types'


interface RenderingOptions {
  manifest: ClientManifest
}

type HeaderRecord = Record<'Content-Type', BaseMime> | Record<ResponseHeader, string | string[]> | Record<string, string | string[]>
type JSONRespondReturn<T extends JSONValue | {} | InvalidJSONValue, U extends ContentfulStatusCode> = Response & TypedResponse<JSONParsed<T>, U, 'json'>
// during development, pages are rendered asynchronously (Hono's own `c.render()` may be asynchronous too)
type RenderReturn<T extends JSONValue | {} | InvalidJSONValue, U extends ContentfulStatusCode> = JSONRespondReturn<T, U> | Promise<JSONRespondReturn<T, U>>
declare module 'hono' {
  interface ContextRenderer {
    // eslint-disable-next-line
    <T extends JSONValue | {} | InvalidJSONValue, U extends ContentfulStatusCode = ContentfulStatusCode>(object: T, status: U, headers?: HeaderRecord): RenderReturn<T, U>
  }
}
const rendering = ({ manifest }: RenderingOptions) => createMiddleware(async (ctx, next) => {
  ctx.setRenderer(<T extends JSONValue | {} | InvalidJSONValue, U extends ContentfulStatusCode = ContentfulStatusCode>(object: T, status: U, headers?: HeaderRecord): RenderReturn<T, U> => {
    const accept = accepts(ctx, {
      header: 'Accept',
      supports: ['text/html', 'application/json'],
      default: 'application/json',
    })
    if (accept !== 'text/html') {
      return ctx.json(object, status, headers)
    }

    const routes = matchedRoutes(ctx)
    const views = findViews(routes[routes.length - 1])
    if (!views) {
      // TODO at least log a warning that the route has no views defined
      return ctx.json(object, status, headers)
    }

    const view = views.get(status) as React.ComponentType<T & {}> | undefined
    if (!view) {
      // TODO at least log a warning that the route has no view defined for the given status code
      return ctx.json(object, status, headers)
    }

    // the view is rendered with the props in their JSON form, which is how the browser receives them for hydration
    const props = JSON.parse(JSON.stringify(object)) as T & {}

    // views render the whole document, including <html>
    const viewElement = React.createElement(view, props)
    const viewHtml = renderToString(viewElement)

    const entry = manifest.views.get(view)
    if (!entry) {
      // eslint-disable-next-line no-console
      console.warn(`View ${view.displayName ?? view.name} is not listed in the client manifest, so it won't be hydrated`)
    }

    const page = `<!DOCTYPE html>${viewHtml}`
    if (entry && manifest.styles) {
      // during development, the dev server renders the view's stylesheets into the page
      const html = manifest.styles(entry).then(styles => injectClientCode(page, manifest, { entry, props }, styles))
      return ctx.html(html, status, headers) as never
    }
    return ctx.html(injectClientCode(page, manifest, entry && { entry, props }), status, headers) as never
  })
  await next()
})

// the views are attached to the route handler, which Hono wraps when the app is mounted into another one (`app.route()`)
function findViews(route: RouterRoute) {
  type Handler = { views?: Map<number, React.ComponentType>, [COMPOSED_HANDLER]?: Handler } | undefined
  let handler = route.handler as Handler
  while (handler && !handler.views) {
    handler = handler[COMPOSED_HANDLER]
  }
  return handler?.views
}

// the client code is injected outside of the tree rendered by React, at the end of <head> and <body>,
// where React ignores it during hydration
function injectClientCode(html: string, manifest: ClientManifest, view?: { entry: ClientEntry, props: unknown }, styles = '') {
  const entries = view ? [manifest.runtime, view.entry] : []
  const stylesheets = new Set(entries.flatMap(({ css }) => css))
  const preloads = new Set(entries.flatMap(({ preload }) => preload))

  const head = [
    manifest.head,
    styles,
    ...[...stylesheets].map(href => `<link rel="stylesheet" href="${escapeAttribute(href)}">`),
    ...[...preloads].map(href => `<link rel="modulepreload" href="${escapeAttribute(href)}">`),
  ]
  const body = [manifest.body]
  if (view) {
    const payload: Payload = { view: view.entry.url, props: view.props }
    // `<` is escaped, so that the JSON can't close the <script> element
    const payloadJson = JSON.stringify(payload).replaceAll('<', '\\u003c')
    body.unshift(
      `<script type="application/json" id="${PAYLOAD_ELEMENT_ID}">${payloadJson}</script>`,
      `<script type="module" src="${escapeAttribute(manifest.runtime.url)}"></script>`,
    )
  }

  return insertBefore(insertBefore(html, '</head>', head.join('')), '</body>', body.join(''))
}

// inserts the content before the last occurrence of the closing tag, i.e. after everything rendered by React
function insertBefore(html: string, closingTag: string, content: string) {
  const index = html.lastIndexOf(closingTag)
  return index === -1 ? html + content : html.slice(0, index) + content + html.slice(index)
}

function escapeAttribute(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

export { rendering }

export type { RenderingOptions }
