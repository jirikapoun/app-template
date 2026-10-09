import 'primereact/resources/themes/lara-light-cyan/theme.css'
import { PrimeReactProvider } from 'primereact/api'


interface AppProps {
  title: string
  children: React.ReactNode
}

const App = ({ title, children }: AppProps) => (
  <PrimeReactProvider>
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

export default App
