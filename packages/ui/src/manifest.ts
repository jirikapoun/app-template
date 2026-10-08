import virtualManifest from 'virtual:maveric/manifest'

import type { ClientManifest } from '@maveric/client'


// client-side code of the views, which the server injects into the rendered pages
const manifest: ClientManifest = virtualManifest

export default manifest
