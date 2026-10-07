import { createRoute, OpenAPIHono } from '@hono/zod-openapi'

import { rendering } from './rendering.js'

import type { ResponseConfig, ZodMediaTypeObject } from '@asteasolutions/zod-to-openapi'
import type { ComputeInput, Hook, RouteConfig, RouteMiddlewareParams } from '@hono/zod-openapi'
import type { View } from '@maveric/client'
import type { TypedResponse } from 'hono'
import type { Env, Handler, Input, MergePath, MiddlewareHandler, Schema, ToSchema } from 'hono/types'
import type { ClientErrorStatusCode, InfoStatusCode, RedirectStatusCode, ServerErrorStatusCode, StatusCode, SuccessStatusCode } from 'hono/utils/http-status'
import type { JSONParsed } from 'hono/utils/types'
import type { z, ZodType } from 'zod'


type MaybePromise<T> = Promise<T> | T

interface StatusCodeRangeDefinitions {
  '1XX': InfoStatusCode
  '2XX': SuccessStatusCode
  '3XX': RedirectStatusCode
  '4XX': ClientErrorStatusCode
  '5XX': ServerErrorStatusCode
}
type RouteConfigStatusCode = keyof StatusCodeRangeDefinitions | StatusCode
type DefinedStatusCodes<R extends CustomRouteConfig> = keyof R['responses'] & RouteConfigStatusCode
type ExtractStatusCode<T extends RouteConfigStatusCode> = T extends keyof StatusCodeRangeDefinitions ? StatusCodeRangeDefinitions[T] : T

type RouteConfigToTypedResponse<R extends CustomRouteConfig> = {
  [Status in DefinedStatusCodes<R>]: ExtractStatusCode<Status> extends (infer Code extends StatusCode)
    ? R['responses'][Status] extends { schema: infer ResponseSchema extends ZodType }
      ? TypedResponse<JSONParsed<z.infer<ResponseSchema>>, Code, 'json'>
      : TypedResponse<null, Code, 'body'>
    : never
}[DefinedStatusCodes<R>] | ('default' extends keyof R['responses']
  ? Exclude<StatusCode, ExtractStatusCode<DefinedStatusCodes<R>>> extends (infer Code extends StatusCode)
    ? R['responses']['default'] extends { schema: infer ResponseSchema extends ZodType }
      ? TypedResponse<JSONParsed<z.infer<ResponseSchema>>, Code, 'json'>
      : TypedResponse<null, Code, 'body'>
    : never
  : never
)
type BoundRouteResponseTypes<R extends CustomRouteConfig> = R extends CustomRouteConfig ? [RouteConfigToTypedResponse<R>] extends [infer Output] ? {
  output: Output
  handler: R extends {
    responses: {
      [statusCode: number]: ZodMediaTypeObject
    }
  } ? MaybePromise<Output> : MaybePromise<Output> | MaybePromise<Response>
} : never : never

class Controller<E extends Env = Env, S extends Schema = {}, BasePath extends string = '/'> extends OpenAPIHono<E, S, BasePath> {
  endpoint<
    R extends CustomRouteConfig,
    I extends Input = ComputeInput<R>,
    P extends string = ConvertPathType<R['path']>,
  >(
    { responses, ...customRouteConfig }: R,
    handler: Handler<
      R['middleware'] extends MiddlewareHandler[] | MiddlewareHandler
        ? RouteMiddlewareParams<R>['env'] & E
        : E,
      P,
      I,
      BoundRouteResponseTypes<R>['handler']
    >,
    hook?: Hook<
      I,
      E,
      P,
    BoundRouteResponseTypes<R>['handler'] | undefined
    >,
  ): Controller<
    E,
  S & ToSchema<
    R['method'],
    MergePath<BasePath, P>,
    I,
    BoundRouteResponseTypes<R>['output']
  >,
  BasePath
  > {
    const responseEntries = Object.entries(responses as CustomRouteConfigWithViews<R>['responses'])
    const routeConfig = {
      ...customRouteConfig,
      responses: Object.fromEntries(responseEntries
        .map(([statusCode, {
          schema,
          view,
          ...responseConfig
        }]) => [statusCode, {
          ...responseConfig,
          ...schema || view
            ? {
              content: {
                ...schema ? { 'application/json': { schema } } : {},
                ...view ? { 'text/html': { /* TODO */ } } : {},
              },
            }
            : {},
        }])),
    }
    for (const [statusCode, { view }] of responseEntries) {
      if (view) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (handler as any).views ??= new Map()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
        ;(handler as any).views.set(Number(statusCode), view as any)
      }
    }
    // short-circuit type inference with `any` to save resources and to avoid type mismatch
    // actual return type is defined by the method declaration above, so it will be correct
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.openapi(routeConfig as any, handler as any, hook as any) as never
  }
}

type CustomRouteConfig = Omit<RouteConfig, 'responses'> & {
  responses: {
    [statusCode: string]: Omit<ResponseConfig, 'content'> & {
      schema?: ZodType
    }
  }
}
type CustomRouteConfigWithViews<R extends CustomRouteConfig> = R & {
  responses: {
    [statusCode in keyof R['responses']]: Omit<ResponseConfig, 'content'> & {
      schema?: R['responses'][statusCode] extends { schema: ZodType } ? R['responses'][statusCode]['schema'] : never
      view?: View<R['responses'][statusCode] extends { schema: ZodType } ? z.infer<R['responses'][statusCode]['schema']> & {} : {}>
    }
  }
}
type ConvertPathType<T extends string> = T extends `${infer Start}/{${infer Param}}${infer Rest}` ? `${Start}/:${Param}${ConvertPathType<Rest>}` : T
const route = createRoute as <P extends string, R extends Omit<CustomRouteConfig, 'path'> & {
  path: P
}>(routeConfig: CustomRouteConfigWithViews<R>) => R & {
  getRoutingPath(): ConvertPathType<R['path']>
}


export {
  Controller,
  rendering,
  route,
}

export type { RenderingOptions } from './rendering.js'
