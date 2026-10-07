import type React from 'react'
import type { z, ZodType } from 'zod'


// React 19's ReactNode includes Promise, so ComponentType would accept async components,
// which suspend and can't be rendered by the synchronous renderToString
type SyncComponent<Props> = (props: Props) => Exclude<React.ReactNode, Promise<unknown>>
type View<P> = SyncComponent<P> & {
  displayName?: string
}

// data the server passes to the browser runtime to hydrate the rendered view
interface Payload {
  /** URL of the view module */
  view: string
  /** props the view has been rendered with */
  props: unknown
}

/** id of the <script type="application/json"> element containing the payload */
const PAYLOAD_ELEMENT_ID = '__maveric'

const view = <PropsSchema extends ZodType>(component: SyncComponent<z.infer<PropsSchema>>) =>
  component as View<z.infer<PropsSchema>>

export {
  PAYLOAD_ELEMENT_ID,
  view,
}

export type {
  Payload,
  View,
}
