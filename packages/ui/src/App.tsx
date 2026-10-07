import { ViteClient } from 'vite-ssr-components/react'


interface AppProps {
  view: React.ReactNode
}

const App = ({ view }: AppProps) => (
  <html lang="en">
    <head>
      <link rel="icon" type="image/svg+xml" href='/favicon.svg' />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Vite + React + Hono</title>
      <ViteClient />
    </head>
    <body>
      <div id="view">{view}</div>
    </body>
  </html>)

export default App
