import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function createToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function tokensMatch(left: string, right: string): boolean {
  const leftHash = Buffer.from(hashToken(left), 'utf8')
  const rightHash = Buffer.from(hashToken(right), 'utf8')
  return timingSafeEqual(leftHash, rightHash)
}
