/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/consistent-type-imports */
import type React from 'react'
import type { z, ZodType } from 'zod'


const isLocal = true // import.meta.url.startsWith('file://')

const { relative, basename, extname } = isLocal
  ? await import('node:path')
  : { relative: null, basename: null, extname: null } as unknown as typeof import('node:path')

const { fileURLToPath } = isLocal
  ? await import('node:url')
  : { fileURLToPath: null } as unknown as typeof import('node:url')

const viewBasePath = isLocal
  ? fileURLToPath(new URL('.', import.meta.url))
  : null as unknown as string

// React 19's ReactNode includes Promise, so ComponentType would accept async components,
// which suspend and can't be rendered by the synchronous renderToString
type SyncComponent<Props> = (props: Props) => Exclude<React.ReactNode, Promise<unknown>>
type View<P> = SyncComponent<P> & {
  displayName: string
  path: string
}

const view = <PropsSchema extends ZodType>(importMetaUrl: string, component: SyncComponent<z.infer<PropsSchema>>) => {
  if (!isLocal) {
    return component as View<z.infer<PropsSchema>>
  }

  const viewComponent = component as View<z.infer<PropsSchema>>
  const filePath = fileURLToPath(importMetaUrl)
  const viewName = basename(filePath, extname(filePath))

  viewComponent.path = relative(viewBasePath, filePath)
  viewComponent.displayName = viewName

  return viewComponent
}

export default view

export type { View }
