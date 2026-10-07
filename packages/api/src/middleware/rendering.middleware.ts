import { accepts } from 'hono/accepts'
import { createMiddleware } from 'hono/factory'
import { matchedRoutes } from 'hono/route'
import React from 'react'
import { renderToString } from 'react-dom/server'

import App from '@app/ui/App'

import type { TypedResponse } from 'hono'
import type { RouterRoute } from 'hono/types'
import type { ResponseHeader } from 'hono/utils/headers'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { BaseMime } from 'hono/utils/mime'
import type { InvalidJSONValue, JSONParsed, JSONValue } from 'hono/utils/types'


type HeaderRecord = Record<'Content-Type', BaseMime> | Record<ResponseHeader, string | string[]> | Record<string, string | string[]>
type JSONRespondReturn<T extends JSONValue | {} | InvalidJSONValue, U extends ContentfulStatusCode> = Response & TypedResponse<JSONParsed<T>, U, 'json'>
declare module 'hono' {
  interface ContextRenderer {
    // eslint-disable-next-line
    <T extends JSONValue | {} | InvalidJSONValue, U extends ContentfulStatusCode = ContentfulStatusCode>(object: T, status?: U, headers?: HeaderRecord): JSONRespondReturn<T, U>
  }
}
const renderingMiddleware = createMiddleware(async (ctx, next) => {
  ctx.setRenderer(<T extends JSONValue | {} | InvalidJSONValue, U extends ContentfulStatusCode = ContentfulStatusCode>(object: T, status?: U, headers?: HeaderRecord): JSONRespondReturn<T, U> => {
    const accept = accepts(ctx, {
      header: 'Accept',
      supports: ['text/html', 'application/json'],
      default: 'application/json',
    })
    if (accept !== 'text/html') {
      return ctx.json(object, status, headers)
    }

    const routes = matchedRoutes(ctx)
    const lastRoute = routes[routes.length - 1]
    if (!routeHasViews(lastRoute)) {
      // TODO at least log a warning that the route has no views defined
      return ctx.json(object, status, headers)
    }

    const statusCode = ctx.res.status
    const view = lastRoute.handler.views.get(statusCode) as React.ComponentType<T & {}> | undefined
    if (!view) {
      // TODO at least log a warning that the route has no view defined for the given status code
      return ctx.json(object, status, headers)
    }

    const viewElement = React.createElement(view, object as T & {})
    const appElement = React.createElement(App, { view: viewElement })
    const appHtml = renderToString(appElement)

    const html = `<!DOCTYPE html>${appHtml}`
    return ctx.html(html, status, headers) as never
  })
  await next()
})

function routeHasViews(route: RouterRoute): route is RouterRoute & { handler: { views: Map<number, React.ComponentType> } } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  return Boolean((route.handler as any).views)
}

export default renderingMiddleware
