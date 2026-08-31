export type AppRole = 'admin' | 'agent'

export interface Profile {
  id: string
  email: string
  fullName: string | null
  role: AppRole
  createdAt: string
}
