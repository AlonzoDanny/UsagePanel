export function formatMinutes(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}

export function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(value)}%`
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
