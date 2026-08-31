import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PaymentStatusBadge } from '../ui/PaymentStatusBadge'
import { UsageProgressBar } from '../ui/UsageProgressBar'
import { UsageStatusBadge } from '../ui/UsageStatusBadge'
import type { Client, ClientSortField, SortDirection } from '../../types/client'
import {
  formatDate,
  formatMinutes,
  formatPercentage,
} from '../../utils/formatters'
import {
  calculateUsagePercentage,
  getUsageStatus,
} from '../../utils/clientMetrics'

interface ClientsTableProps {
  clients: Client[]
  sortField: ClientSortField
  sortDirection: SortDirection
  onSort: (field: ClientSortField) => void
}

const columns: Array<{
  label: string
  field?: ClientSortField
  align?: string
}> = [
  { label: 'Empresa', field: 'companyName' },
  { label: 'Representante' },
  { label: 'Plan' },
  { label: 'Asignados', field: 'assignedMinutes', align: 'text-right' },
  { label: 'Consumidos', field: 'consumedMinutes', align: 'text-right' },
  { label: 'Consumo', field: 'usagePercentage', align: 'text-right' },
  { label: 'Uso' },
  { label: 'Estado' },
  { label: 'Fecha de pago', field: 'paymentDate' },
  { label: 'Pago' },
  { label: '' },
]

export function ClientsTable({
  clients,
  sortField,
  sortDirection,
  onSort,
}: ClientsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
      <table className="w-full min-w-[1200px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map(({ label, field, align }, index) => (
              <th
                key={`${label}-${index}`}
                scope="col"
                className={`whitespace-nowrap px-4 py-3.5 font-semibold ${align ?? ''}`}
              >
                {field ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    onClick={() => onSort(field)}
                  >
                    {label}
                    {sortField === field ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>
                ) : (
                  label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clients.map((client) => {
            const percentage = calculateUsagePercentage(
              client.consumedMinutes,
              client.assignedMinutes,
            )
            return (
              <tr
                key={client.id}
                className="transition-colors hover:bg-slate-50"
              >
                <td className="px-4 py-4">
                  <Link
                    to={`/clients/${client.id}`}
                    className="font-semibold text-slate-900 hover:text-cyan-700"
                  >
                    {client.companyName}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">
                    {client.id}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {client.representativeName}
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {client.plan}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-medium tabular-nums text-slate-700">
                  {formatMinutes(client.assignedMinutes)}
                </td>
                <td className="px-4 py-4 text-right font-medium tabular-nums text-slate-700">
                  {formatMinutes(client.consumedMinutes)}
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums text-slate-900">
                  {formatPercentage(percentage)}
                </td>
                <td className="px-4 py-4">
                  <UsageProgressBar percentage={percentage} />
                </td>
                <td className="px-4 py-4">
                  <UsageStatusBadge status={getUsageStatus(percentage)} />
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                  {formatDate(client.paymentDate)}
                </td>
                <td className="px-4 py-4">
                  <PaymentStatusBadge status={client.paymentStatus} />
                </td>
                <td className="px-4 py-4">
                  <Link
                    to={`/clients/${client.id}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    Ver detalles
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
