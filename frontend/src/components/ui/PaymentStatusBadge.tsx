import type { PaymentStatus } from '../../types/client'

const statusStyles: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  paid: {
    label: 'Al día',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  overdue: {
    label: 'Vencido',
    className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  },
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, className } = statusStyles[status]
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  )
}
