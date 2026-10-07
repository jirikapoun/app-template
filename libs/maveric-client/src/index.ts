import type React from 'react'
import type { z, ZodType } from 'zod'


// React 19's ReactNode includes Promise, so ComponentType would accept async components,
// which suspend and can't be rendered by the synchronous renderToString
type SyncComponent<Props> = (props: Props) => Exclude<React.ReactNode, Promise<unknown>>
type View<P> = SyncComponent<P> & {
  displayName?: string
}

const view = <PropsSchema extends ZodType>(component: SyncComponent<z.infer<PropsSchema>>) =>
  component as View<z.infer<PropsSchema>>

export { view }

export type { View }
