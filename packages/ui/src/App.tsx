import 'primereact/resources/themes/lara-light-cyan/theme.css'
import { useServerInsertedHTML } from '@maveric/client'
import { PrimeReactProvider, PrimeReactStyleSheet } from 'primereact/api'
import { useState } from 'react'


interface AppProps {
  title: string
  children: React.ReactNode
}

const App = ({ title, children }: AppProps) => {
  // PrimeReact components insert their styles in the browser only after hydration, the patched PrimeReact
  // collects them on the server instead, so that the page is sent with them
  const [styleSheet] = useState(() => new PrimeReactStyleSheet())
  useServerInsertedHTML(() => styleSheet.toString())

  return (
    <PrimeReactProvider value={{ styleSheet }}>
      <html lang="en">
        <head>
          <link rel="icon" type="image/svg+xml" href='/favicon.svg' />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{title}</title>
        </head>
        <body>
          {children}
        </body>
      </html>
    </PrimeReactProvider>
  )
}

export default App
