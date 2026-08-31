import { apiRequest } from './apiClient'
import type { Profile } from '../types/auth'

export async function getMembers(): Promise<Profile[]> {
  return (await apiRequest<{ members: Profile[] }>('/members')).members
}
