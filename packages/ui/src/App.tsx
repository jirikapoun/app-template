interface AppProps {
  title: string
  children: React.ReactNode
}

const App = ({ title, children }: AppProps) => (
  <html lang="en">
    <head>
      <link rel="icon" type="image/svg+xml" href='/favicon.svg' />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
    </head>
    <body>
      <div id="view">{children}</div>
    </body>
  </html>)

export default App
