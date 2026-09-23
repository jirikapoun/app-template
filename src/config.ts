import { z } from '@hono/zod-openapi'
import packageJson from '../package.json' with { type: 'json' }


if (!('NODE_ENV' in process.env)) {
  process.env.NODE_ENV = 'development'
}

const boolean = (defaultValue: boolean) => z
  .enum(['true', 'false', '1', '0', ''])
  .default('')
  .transform(val => val === ''
    ? defaultValue
    : val === 'true' || val === '1')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000).describe('HTTP port the server listens on'),
  APP_NAME: z.string().default(packageJson.name).describe('Application name shown in the frontend'),
  API_DOCS: boolean(true).describe('Enables public API documentation'),
  // DATABASE_URL: z.string(),
  // JWT_SECRET: z.string(),
  // JWT_EXPIRES_IN: z.string(),
})

const env = envSchema.parse(process.env)

const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  appName: env.APP_NAME,
  appVersion: packageJson.version,
  apiDocs: env.API_DOCS,
} as const

export default config
