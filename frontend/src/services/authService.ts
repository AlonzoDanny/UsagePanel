import { apiRequest } from './apiClient'
import type { AppRole, Profile } from '../types/auth'

interface UserResponse {
  user: Profile
}

export async function getCurrentUser(): Promise<Profile | null> {
  try {
    return (await apiRequest<UserResponse>('/auth/me')).user
  } catch {
    return null
  }
}

export async function signInWithPassword(email: string, password: string) {
  return apiRequest<UserResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function signOut() {
  await apiRequest<void>('/auth/logout', { method: 'POST' })
}

export async function requestPasswordReset(email: string) {
  return apiRequest<{ message: string; resetUrl?: string }>(
    '/auth/password-reset',
    { method: 'POST', body: JSON.stringify({ email }) },
  )
}

export async function updatePassword(password: string) {
  const token = new URLSearchParams(window.location.search).get('token')
  if (!token) throw new Error('El enlace de recuperación no es válido.')
  return apiRequest<UserResponse>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export async function inviteMember(
  email: string,
  fullName: string,
  role: AppRole,
) {
  return apiRequest<{ invitation: { id: string }; invitationUrl?: string }>(
    '/members/invitations',
    { method: 'POST', body: JSON.stringify({ email, fullName, role }) },
  )
}

export async function changeMemberRole(userId: string, role: AppRole) {
  return apiRequest<UserResponse>(`/members/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}
