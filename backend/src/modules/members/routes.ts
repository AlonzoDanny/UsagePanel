import { Role } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../config/env.js'
import { hashToken } from '../../lib/crypto.js'
import { prisma } from '../../lib/prisma.js'
import {
  authenticate,
  authorize,
  ensureTrustedOrigin,
  verifyCsrf,
} from '../auth/authentication.js'
import {
  createInvitationUrl,
  newInvitationToken,
  serializeUser,
} from '../auth/routes.js'

const invitationSchema = z.object({
  email: z.email().trim().toLowerCase(),
  fullName: z.string().trim().min(2).max(120),
  role: z.enum(['admin', 'agent']).default('agent'),
})
const roleSchema = z.object({ role: z.enum(['admin', 'agent']) })
const adminOnly = [authenticate, authorize([Role.ADMIN])]

function toDatabaseRole(role: 'admin' | 'agent'): Role {
  return role === 'admin' ? Role.ADMIN : Role.AGENT
}

async function listMembers() {
  const members = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
  return { members: members.map(serializeUser) }
}

export async function memberRoutes(app: FastifyInstance) {
  app.get('/members', { preHandler: adminOnly }, listMembers)
  app.get('/users', { preHandler: adminOnly }, listMembers)

  app.post(
    '/members/invitations',
    { preHandler: [ensureTrustedOrigin, ...adminOnly, verifyCsrf] },
    async (request, reply) => {
      const input = invitationSchema.safeParse(request.body)
      if (!input.success)
        return reply
          .code(400)
          .send({ error: 'Los datos de la invitación no son válidos.' })
      const [user, pendingInvitation] = await Promise.all([
        prisma.user.findUnique({ where: { email: input.data.email } }),
        prisma.invitation.findFirst({
          where: {
            email: input.data.email,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        }),
      ])
      if (user)
        return reply
          .code(409)
          .send({ error: 'Ya existe un usuario con este correo.' })
      if (pendingInvitation)
        return reply
          .code(409)
          .send({ error: 'Ya existe una invitación vigente para este correo.' })
      const token = newInvitationToken()
      const invitation = await prisma.invitation.create({
        data: {
          email: input.data.email,
          fullName: input.data.fullName,
          role: toDatabaseRole(input.data.role),
          tokenHash: hashToken(token),
          expiresAt: new Date(
            Date.now() + env.INVITATION_TTL_HOURS * 60 * 60 * 1000,
          ),
          createdById: request.auth!.userId,
        },
      })
      return reply.code(201).send({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role === Role.ADMIN ? 'admin' : 'agent',
          expiresAt: invitation.expiresAt,
        },
        invitationUrl: createInvitationUrl(token),
      })
    },
  )

  app.patch(
    '/members/:userId/role',
    { preHandler: [ensureTrustedOrigin, ...adminOnly, verifyCsrf] },
    async (request, reply) => {
      const params = z.object({ userId: z.uuid() }).safeParse(request.params)
      const input = roleSchema.safeParse(request.body)
      if (!params.success || !input.success)
        return reply.code(400).send({ error: 'Datos de rol inválidos.' })
      if (params.data.userId === request.auth!.userId)
        return reply
          .code(400)
          .send({ error: 'No puedes modificar tu propio rol.' })
      const member = await prisma.user.findUnique({
        where: { id: params.data.userId },
      })
      if (!member)
        return reply.code(404).send({ error: 'Miembro no encontrado.' })
      const nextRole = toDatabaseRole(input.data.role)
      if (member.role === Role.ADMIN && nextRole === Role.AGENT) {
        const admins = await prisma.user.count({ where: { role: Role.ADMIN } })
        if (admins <= 1)
          return reply
            .code(400)
            .send({ error: 'Debe existir al menos un administrador.' })
      }
      const updated = await prisma.user.update({
        where: { id: member.id },
        data: { role: nextRole },
      })
      return { user: serializeUser(updated) }
    },
  )
}
