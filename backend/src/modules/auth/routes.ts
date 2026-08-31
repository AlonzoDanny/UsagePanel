import { Role } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createToken, hashToken } from '../../lib/crypto.js'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'
import {
  authenticate,
  clearSessionCookies,
  createSession,
  ensureTrustedOrigin,
  verifyCsrf,
} from './authentication.js'
import { hashPassword, verifyPassword } from './passwords.js'

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(256),
})
const registrationSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(12).max(256),
})
const passwordResetSchema = z.object({ email: z.email().trim().toLowerCase() })
const passwordResetConfirmationSchema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(12).max(256),
})
const LOGIN_LIMIT = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

export async function authRoutes(app: FastifyInstance) {
  app.post(
    '/auth/login',
    {
      config: { rateLimit: { max: LOGIN_LIMIT, timeWindow: '15 minutes' } },
      preHandler: ensureTrustedOrigin,
    },
    async (request, reply) => {
      const input = loginSchema.safeParse(request.body)
      if (!input.success)
        return reply.code(400).send({ error: 'Datos de acceso inválidos.' })
      const user = await prisma.user.findUnique({
        where: { email: input.data.email },
      })
      const invalidCredentials = () =>
        reply.code(401).send({ error: 'Correo o contraseña incorrectos.' })
      if (!user || (user.lockedUntil && user.lockedUntil > new Date()))
        return invalidCredentials()
      const activeFailedAttempts =
        user.lockedUntil && user.lockedUntil <= new Date()
          ? 0
          : user.failedAttempts
      const isValid = await verifyPassword(
        user.passwordHash,
        input.data.password,
      )
      if (!isValid) {
        const failedAttempts = activeFailedAttempts + 1
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedAttempts,
            lockedUntil:
              failedAttempts >= LOGIN_LIMIT
                ? new Date(Date.now() + LOCK_DURATION_MS)
                : null,
          },
        })
        return invalidCredentials()
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      })
      await createSession(reply, user)
      return reply.send({ user: serializeUser(user) })
    },
  )

  app.post(
    '/auth/password-reset',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      preHandler: ensureTrustedOrigin,
    },
    async (request, reply) => {
      const input = passwordResetSchema.safeParse(request.body)
      if (!input.success)
        return reply.code(400).send({ error: 'Correo inválido.' })
      const user = await prisma.user.findUnique({
        where: { email: input.data.email },
      })
      if (!user)
        return reply.send({
          message: 'Si la cuenta existe, se enviará un enlace de recuperación.',
        })
      const token = createToken()
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      })
      return reply.send({
        message: 'Si la cuenta existe, se enviará un enlace de recuperación.',
        resetUrl:
          env.NODE_ENV === 'development'
            ? `${env.APP_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`
            : undefined,
      })
    },
  )

  app.post(
    '/auth/password-reset/confirm',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      preHandler: ensureTrustedOrigin,
    },
    async (request, reply) => {
      const input = passwordResetConfirmationSchema.safeParse(request.body)
      if (!input.success)
        return reply
          .code(400)
          .send({ error: 'Datos de recuperación inválidos.' })
      const reset = await prisma.passwordReset.findUnique({
        where: { tokenHash: hashToken(input.data.token) },
      })
      if (!reset || reset.usedAt || reset.expiresAt <= new Date())
        return reply
          .code(400)
          .send({ error: 'El enlace ha caducado o no es válido.' })
      const passwordHash = await hashPassword(input.data.password)
      const user = await prisma.$transaction(async (transaction) => {
        const updatedUser = await transaction.user.update({
          where: { id: reset.userId },
          data: { passwordHash, failedAttempts: 0, lockedUntil: null },
        })
        await transaction.passwordReset.update({
          where: { id: reset.id },
          data: { usedAt: new Date() },
        })
        await transaction.session.deleteMany({
          where: { userId: reset.userId },
        })
        return updatedUser
      })
      await createSession(reply, user)
      return reply.send({ user: serializeUser(user) })
    },
  )

  app.post(
    '/auth/register',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      preHandler: ensureTrustedOrigin,
    },
    async (request, reply) => {
      const input = registrationSchema.safeParse(request.body)
      if (!input.success)
        return reply.code(400).send({
          error:
            'Datos de registro inválidos. La contraseña debe tener al menos 12 caracteres.',
        })
      const invitation = await prisma.invitation.findUnique({
        where: { tokenHash: hashToken(input.data.token) },
      })
      if (
        !invitation ||
        invitation.acceptedAt ||
        invitation.revokedAt ||
        invitation.expiresAt <= new Date()
      )
        return reply
          .code(400)
          .send({ error: 'La invitación no es válida o ha caducado.' })
      const existingUser = await prisma.user.findUnique({
        where: { email: invitation.email },
      })
      if (existingUser)
        return reply
          .code(400)
          .send({ error: 'Ya existe una cuenta con este correo.' })
      const passwordHash = await hashPassword(input.data.password)
      const user = await prisma.$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            email: invitation.email,
            fullName: invitation.fullName,
            role: invitation.role,
            passwordHash,
          },
        })
        await transaction.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        })
        return createdUser
      })
      await createSession(reply, user)
      return reply.code(201).send({ user: serializeUser(user) })
    },
  )

  app.get('/auth/me', { preHandler: authenticate }, async (request) => ({
    user: request.auth && {
      id: request.auth.userId,
      email: request.auth.email,
      fullName: request.auth.fullName,
      role: request.auth.role === Role.ADMIN ? 'admin' : 'agent',
      createdAt: request.auth.createdAt,
    },
  }))

  app.post(
    '/auth/logout',
    { preHandler: [ensureTrustedOrigin, authenticate, verifyCsrf] },
    async (request, reply) => {
      if (request.auth)
        await prisma.session.delete({ where: { id: request.auth.sessionId } })
      clearSessionCookies(reply)
      return reply.code(204).send()
    },
  )
}

export function serializeUser(user: {
  id: string
  email: string
  fullName: string
  role: string
  createdAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role === Role.ADMIN ? 'admin' : 'agent',
    createdAt: user.createdAt,
  }
}

export function createInvitationUrl(token: string): string | undefined {
  return env.NODE_ENV === 'development'
    ? `${env.APP_ORIGIN}/register?token=${encodeURIComponent(token)}`
    : undefined
}

export function newInvitationToken() {
  return createToken()
}
