import 'dotenv/config'
import { Role } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { hashPassword } from '../modules/auth/passwords.js'

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'Administrador inicial'

if (
  !email ||
  !/^\S+@\S+\.\S+$/.test(email) ||
  !password ||
  password.length < 12
) {
  console.error(
    'Define ADMIN_EMAIL, ADMIN_PASSWORD (12+ caracteres) y opcionalmente ADMIN_FULL_NAME.',
  )
  process.exit(1)
}

const passwordHash = await hashPassword(password)
const user = await prisma.user.upsert({
  where: { email },
  create: { email, fullName, passwordHash, role: Role.ADMIN },
  update: {
    fullName,
    passwordHash,
    role: Role.ADMIN,
    failedAttempts: 0,
    lockedUntil: null,
  },
})

console.log(`Administrador listo: ${user.email}`)
await prisma.$disconnect()
