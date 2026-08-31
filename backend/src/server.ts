import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'
import { authRoutes } from './modules/auth/routes.js'
import { clientRoutes } from './modules/clients/routes.js'
import { memberRoutes } from './modules/members/routes.js'

const app = Fastify({
  logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
  trustProxy: env.NODE_ENV === 'production',
})

await app.register(helmet, { global: true })
await app.register(cors, {
  origin: env.APP_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
})
await app.register(cookie, { secret: env.COOKIE_SECRET, hook: 'onRequest' })
await app.register(rateLimit, {
  global: true,
  max: 300,
  timeWindow: '1 minute',
})

app.get('/health', async () => ({ status: 'ok' }))
await app.register(authRoutes, { prefix: '/api' })
await app.register(memberRoutes, { prefix: '/api' })
await app.register(clientRoutes, { prefix: '/api' })

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error)
  const code =
    typeof error === 'object' && error && 'code' in error
      ? error.code
      : undefined
  if (code === 'P2002')
    return reply.code(409).send({ error: 'El recurso ya existe.' })
  return reply.code(500).send({ error: 'Ocurrió un error interno.' })
})

async function start() {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

async function shutdown() {
  await app.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.once('SIGINT', () => void shutdown())
process.once('SIGTERM', () => void shutdown())
void start()
