import { apiRequest } from './apiClient'
import type { Client } from '../types/client'

export async function getClients(): Promise<Client[]> {
  return (await apiRequest<{ clients: Client[] }>('/clients')).clients
}

export async function getClientById(id: string): Promise<Client | undefined> {
  try {
    return (await apiRequest<{ client: Client }>(`/clients/${id}`)).client
  } catch {
    return undefined
  }
}
