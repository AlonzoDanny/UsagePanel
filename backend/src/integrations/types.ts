/**
 * Contract for server-only providers such as n8n or telephone APIs.
 * Implementations belong here and must read credentials only from backend env vars.
 */
export interface UsageProvider {
  getClientUsage(clientId: string): Promise<{
    assignedMinutes: number
    consumedMinutes: number
    updatedAt: Date
  }>
}
