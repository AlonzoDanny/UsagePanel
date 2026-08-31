import type { FastifyInstance } from 'fastify'
import { authenticate } from '../auth/authentication.js'
import { clients } from './data.js'

export async function clientRoutes(app: FastifyInstance) {
  app.get('/clients', { preHandler: authenticate }, async () => ({ clients }))
  app.get(
    '/clients/:clientId',
    { preHandler: authenticate },
    async (request, reply) => {
      const { clientId } = request.params as { clientId: string }
      const client = clients.find((item) => item.id === clientId)
      if (!client)
        return reply.code(404).send({ error: 'Cliente no encontrado.' })
      return { client }
    },
  )
}
