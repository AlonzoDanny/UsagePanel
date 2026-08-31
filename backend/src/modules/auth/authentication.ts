import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Role } from '@prisma/client'
import { env, isProduction } from '../../config/env.js'
import { createToken, hashToken, tokensMatch } from '../../lib/crypto.js'
import { prisma } from '../../lib/prisma.js'

const SESSION_COOKIE = 'usagepanel_session'
const CSRF_COOKIE = 'usagepanel_csrf'
const SESSION_DAYS = 7

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const cookie = request.cookies[SESSION_COOKIE]
  if (!cookie)
    return reply.code(401).send({ error: 'Autenticación requerida.' })
  const unsigned = request.unsignCookie(cookie)
  if (!unsigned.valid)
    return reply.code(401).send({ error: 'Sesión inválida.' })
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(unsigned.value) },
    include: { user: true },
  })
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } })
    clearSessionCookies(reply)
    return reply.code(401).send({ error: 'La sesión ha caducado.' })
  }
  request.auth = {
    sessionId: session.id,
    userId: session.user.id,
    email: session.user.email,
    fullName: session.user.fullName,
    role: session.user.role,
    createdAt: session.user.createdAt,
    csrfTokenHash: session.csrfTokenHash,
  }
}

export function authorize(roles: Role[]) {
  return async function authorizeRequest(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    if (!request.auth || !roles.includes(request.auth.role))
      return reply
        .code(403)
        .send({ error: 'No tienes permisos para realizar esta acción.' })
  }
}

export async function ensureTrustedOrigin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (request.headers.origin !== env.APP_ORIGIN)
    return reply.code(403).send({ error: 'Origen no permitido.' })
}

export async function verifyCsrf(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth)
    return reply.code(401).send({ error: 'Autenticación requerida.' })
  const header = request.headers['x-csrf-token']
  const csrfCookie = request.cookies[CSRF_COOKIE]
  if (
    typeof header !== 'string' ||
    !csrfCookie ||
    !tokensMatch(header, csrfCookie) ||
    hashToken(header) !== request.auth.csrfTokenHash
  )
    return reply.code(403).send({ error: 'Token CSRF inválido.' })
}

export async function createSession(
  reply: FastifyReply,
  user: { id: string; email: string; fullName: string; role: Role },
) {
  const rawToken = createToken()
  const csrfToken = createToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await prisma.session.create({
    data: {
      tokenHash: hashToken(rawToken),
      csrfTokenHash: hashToken(csrfToken),
      userId: user.id,
      expiresAt,
    },
  })
  reply.setCookie(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    signed: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
  reply.setCookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export function clearSessionCookies(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
  reply.clearCookie(CSRF_COOKIE, { path: '/' })
}
