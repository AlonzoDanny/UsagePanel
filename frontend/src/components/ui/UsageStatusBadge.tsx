import type { UsageStatus } from '../../types/client'

const statusStyles: Record<UsageStatus, { label: string; className: string }> =
  {
    normal: {
      label: 'Normal',
      className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    },
    high: {
      label: 'Consumo alto',
      className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    },
    limit: {
      label: 'Límite alcanzado',
      className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    },
    exceeded: {
      label: 'Excedido',
      className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    },
  }

export function UsageStatusBadge({ status }: { status: UsageStatus }) {
  const { label, className } = statusStyles[status]
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  )
}
