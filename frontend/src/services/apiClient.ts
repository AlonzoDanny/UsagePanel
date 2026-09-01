import { env } from '../config/env'

function getCsrfToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('usagepanel_csrf='))
    ?.split('=')[1]
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!env.isApiConfigured)
    throw new Error('La URL del backend no está configurada.')
  const method = options.method?.toUpperCase() ?? 'GET'
  const headers = new Headers(options.headers)
  if (options.body !== undefined && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD'].includes(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) headers.set('X-CSRF-Token', decodeURIComponent(csrfToken))
  }
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })
  if (response.status === 204) return undefined as T
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string
  }
  if (!response.ok)
    throw new Error(data.error ?? 'No fue posible completar la solicitud.')
  return data
}
