import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_ORIGIN: z.url(),
  DATABASE_URL: z.url(),
  COOKIE_SECRET: z.string().min(32),
  INVITATION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
})

const result = schema.safeParse(process.env)
if (!result.success) {
  console.error(
    'Variables de entorno inválidas:',
    result.error.flatten().fieldErrors,
  )
  process.exit(1)
}

export const env = result.data
export const isProduction = env.NODE_ENV === 'production'
