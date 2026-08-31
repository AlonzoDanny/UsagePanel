import argon2 from 'argon2'

const passwordOptions = {
  // node-argon2 exposes this constant as number; its typed value is 2.
  type: 2 as const,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
}

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, passwordOptions)
}

export function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hash, password)
}
