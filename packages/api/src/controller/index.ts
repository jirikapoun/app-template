/* eslint-disable @typescript-eslint/no-shadow */
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'

import type { ResponseConfig, ZodMediaTypeObject } from '@asteasolutions/zod-to-openapi'
import type { ComputeInput, Hook, RouteConfig, RouteMiddlewareParams } from '@hono/zod-openapi'
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
    ? R['responses'][Status] extends { schema: infer Schema extends ZodType }
      ? TypedResponse<JSONParsed<z.infer<Schema>>, Code, 'json'>
      : TypedResponse<null, Code, 'body'>
    : never
}[DefinedStatusCodes<R>] | ('default' extends keyof R['responses']
  ? Exclude<StatusCode, ExtractStatusCode<DefinedStatusCodes<R>>> extends (infer Code extends StatusCode)
    ? R['responses']['default'] extends { schema: infer Schema extends ZodType }
      ? TypedResponse<JSONParsed<z.infer<Schema>>, Code, 'json'>
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
    const routeConfig = {
      ...customRouteConfig,
      responses: Object.fromEntries(Object
        .entries(responses)
        .map(([statusCode, {
          schema,
          ...responseConfig
        }]) => [statusCode, {
          ...responseConfig,
          ...schema
            ? { content: { 'application/json': { schema } } }
            : {},
        }])),
    }
    // short-circuit type inference with `any` to save resources and to avoid type mismatch
    // actual return type is defined by the method declaration above, so it will be correct
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
    return this.openapi(routeConfig as any, handler as any, hook as any) as any
  }
}

type CustomRouteConfig = Omit<RouteConfig, 'responses'> & {
  responses: {
    [statusCode: string]: Omit<ResponseConfig, 'content'> & {
      schema?: ZodType
    }
  }
}
type ConvertPathType<T extends string> = T extends `${infer Start}/{${infer Param}}${infer Rest}` ? `${Start}/:${Param}${ConvertPathType<Rest>}` : T
const customCreateRoute = createRoute as <P extends string, R extends Omit<CustomRouteConfig, 'path'> & {
  path: P
}>(routeConfig: R) => R & {
  getRoutingPath(): ConvertPathType<R['path']>
}


export default Controller

export { customCreateRoute as createRoute }
