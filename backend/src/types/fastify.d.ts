import type { Role } from '@prisma/client'

declare module 'fastify' {
  interface FastifyRequest {
    auth: {
      sessionId: string
      userId: string
      email: string
      fullName: string
      role: Role
      createdAt: Date
      csrfTokenHash: string
    } | null
  }
}
