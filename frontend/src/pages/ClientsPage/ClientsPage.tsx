import {
  AlertTriangle,
  Building2,
  Gauge,
  Search,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ClientsTable } from '../../components/clients/ClientsTable'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { StatCard } from '../../components/ui/StatCard'
import { getClients } from '../../services/clientService'
import type {
  Client,
  ClientSortField,
  PaymentStatus,
  PlanType,
  SortDirection,
  UsageStatus,
} from '../../types/client'
import {
  calculateUsagePercentage,
  getUsageStatus,
} from '../../utils/clientMetrics'
import { formatMinutes } from '../../utils/formatters'

const paymentLabels: Record<PaymentStatus, string> = {
  paid: 'Al día',
  pending: 'Pendiente',
  overdue: 'Vencido',
}
const usageLabels: Record<UsageStatus, string> = {
  normal: 'Normal',
  high: 'Consumo alto',
  limit: 'Límite alcanzado',
  exceeded: 'Excedido',
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [usageFilter, setUsageFilter] = useState<'all' | UsageStatus>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>(
    'all',
  )
  const [planFilter, setPlanFilter] = useState<'all' | PlanType>('all')
  const [sortField, setSortField] = useState<ClientSortField>('companyName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() =>
        setError(
          'No fue posible cargar los clientes. Intenta de nuevo más tarde.',
        ),
      )
      .finally(() => setIsLoading(false))
  }, [])
  const plans = [...new Set(clients.map((client) => client.plan))].sort()
  const filteredClients = clients
    .filter((client) => {
      const normalized = query.toLocaleLowerCase('es')
      const matchesSearch = [
        client.companyName,
        client.representativeName,
        client.plan,
        client.id,
      ].some((value) => value.toLocaleLowerCase('es').includes(normalized))
      const usageStatus = getUsageStatus(
        calculateUsagePercentage(
          client.consumedMinutes,
          client.assignedMinutes,
        ),
      )
      return (
        matchesSearch &&
        (usageFilter === 'all' || usageStatus === usageFilter) &&
        (paymentFilter === 'all' || client.paymentStatus === paymentFilter) &&
        (planFilter === 'all' || client.plan === planFilter)
      )
    })
    .sort((a, b) => {
      const aValue =
        sortField === 'usagePercentage'
          ? calculateUsagePercentage(a.consumedMinutes, a.assignedMinutes)
          : a[sortField]
      const bValue =
        sortField === 'usagePercentage'
          ? calculateUsagePercentage(b.consumedMinutes, b.assignedMinutes)
          : b[sortField]
      const result =
        typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue), 'es')
      return sortDirection === 'asc' ? result : -result
    })
  const totalAssigned = clients.reduce(
    (total, client) => total + client.assignedMinutes,
    0,
  )
  const totalConsumed = clients.reduce(
    (total, client) => total + client.consumedMinutes,
    0,
  )
  const highUsage = clients.filter(
    (client) =>
      getUsageStatus(
        calculateUsagePercentage(
          client.consumedMinutes,
          client.assignedMinutes,
        ),
      ) === 'high',
  ).length
  const exceeded = clients.filter(
    (client) =>
      getUsageStatus(
        calculateUsagePercentage(
          client.consumedMinutes,
          client.assignedMinutes,
        ),
      ) === 'exceeded',
  ).length
  function handleSort(field: ClientSortField) {
    if (field === sortField)
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold text-cyan-700">
          Administración de consumo
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          Clientes
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Consulta el uso de minutos y el estado de facturación de cada cuenta.
        </p>
      </header>
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState>{error}</ErrorState>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Total de clientes"
              value={String(clients.length)}
              icon={<UsersRound className="h-5 w-5" />}
            />
            <StatCard
              label="Minutos asignados"
              value={formatMinutes(totalAssigned)}
              icon={<Building2 className="h-5 w-5" />}
            />
            <StatCard
              label="Minutos consumidos"
              value={formatMinutes(totalConsumed)}
              icon={<Gauge className="h-5 w-5" />}
            />
            <StatCard
              label="Consumo alto"
              value={String(highUsage)}
              icon={<AlertTriangle className="h-5 w-5" />}
              accent="amber"
            />
            <StatCard
              label="Clientes excedidos"
              value={String(exceeded)}
              icon={<AlertTriangle className="h-5 w-5" />}
              accent="rose"
            />
          </section>
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_160px]">
              <label className="relative">
                <span className="sr-only">Buscar clientes</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar empresa, representante, plan o ID..."
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
              </label>
              <FilterSelect
                label="Estado de consumo"
                value={usageFilter}
                onChange={(value) =>
                  setUsageFilter(value as 'all' | UsageStatus)
                }
                options={[
                  ['all', 'Todos'],
                  ['normal', usageLabels.normal],
                  ['high', usageLabels.high],
                  ['exceeded', usageLabels.exceeded],
                ]}
              />
              <FilterSelect
                label="Estado de pago"
                value={paymentFilter}
                onChange={(value) =>
                  setPaymentFilter(value as 'all' | PaymentStatus)
                }
                options={[['all', 'Todos'], ...Object.entries(paymentLabels)]}
              />
              <FilterSelect
                label="Plan"
                value={planFilter}
                onChange={(value) => setPlanFilter(value as 'all' | PlanType)}
                options={[
                  ['all', 'Todos'],
                  ...plans.map((plan) => [plan, plan]),
                ]}
              />
            </div>
          </section>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                {filteredClients.length}
              </span>{' '}
              {filteredClients.length === 1
                ? 'cliente encontrado'
                : 'clientes encontrados'}
            </p>
          </div>
          {filteredClients.length ? (
            <div className="mt-3">
              <ClientsTable
                clients={filteredClients}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
          ) : (
            <div className="mt-3">
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                No hay clientes que coincidan con los filtros seleccionados.
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[][]
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}
