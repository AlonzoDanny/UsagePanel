import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  Gauge,
  UserRound,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PaymentStatusBadge } from '../../components/ui/PaymentStatusBadge'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/ui/States'
import { UsageProgressBar } from '../../components/ui/UsageProgressBar'
import { UsageStatusBadge } from '../../components/ui/UsageStatusBadge'
import { getClientById } from '../../services/clientService'
import type { Client } from '../../types/client'
import {
  calculateExceededMinutes,
  calculateRemainingMinutes,
  calculateUsagePercentage,
  getUsageStatus,
} from '../../utils/clientMetrics'
import {
  formatDate,
  formatDateTime,
  formatMinutes,
  formatPercentage,
} from '../../utils/formatters'

export function ClientDetailPage() {
  const { clientId = '' } = useParams()
  const [client, setClient] = useState<Client>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getClientById(clientId)
      .then(setClient)
      .catch(() =>
        setError('No fue posible cargar la información del cliente.'),
      )
      .finally(() => setIsLoading(false))
  }, [clientId])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState>{error}</ErrorState>
  if (!client)
    return (
      <>
        <Link
          to="/clients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a clientes
        </Link>
        <div className="mt-6">
          <EmptyState message="No encontramos este cliente." />
        </div>
      </>
    )

  const percentage = calculateUsagePercentage(
    client.consumedMinutes,
    client.assignedMinutes,
  )
  const remaining = calculateRemainingMinutes(
    client.consumedMinutes,
    client.assignedMinutes,
  )
  const exceeded = calculateExceededMinutes(
    client.consumedMinutes,
    client.assignedMinutes,
  )
  const usageStatus = getUsageStatus(percentage)

  return (
    <>
      <Link
        to="/clients"
        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>
      <header className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="font-mono text-sm text-slate-500">{client.id}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            {client.companyName}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Cuenta de {client.representativeName}
          </p>
        </div>
        <div className="flex gap-2">
          <UsageStatusBadge status={usageStatus} />
          <PaymentStatusBadge status={client.paymentStatus} />
        </div>
      </header>
      <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Consumo del periodo actual
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                {formatPercentage(percentage)}
              </p>
            </div>
            <span className="rounded-lg bg-slate-100 p-3 text-slate-600">
              <Gauge className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-7">
            <UsageProgressBar percentage={percentage} size="large" />
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-slate-500">
                {formatMinutes(client.consumedMinutes)} consumidos
              </span>
              <span className="font-medium text-slate-700">
                de {formatMinutes(client.assignedMinutes)} min.
              </span>
            </div>
          </div>
          {exceeded > 0 ? (
            <div className="mt-6 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <span className="font-semibold">Límite superado:</span>{' '}
              {formatMinutes(exceeded)} minutos excedidos.
            </div>
          ) : (
            <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Disponibles:</span>{' '}
              {formatMinutes(remaining)} minutos.
            </div>
          )}
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">
            Datos de la cuenta
          </h2>
          <dl className="mt-5 divide-y divide-slate-100">
            <DetailRow
              icon={<UserRound />}
              label="Representante"
              value={client.representativeName}
            />
            <DetailRow
              icon={<CreditCard />}
              label="Plan contratado"
              value={client.plan}
            />
            <DetailRow
              icon={<CalendarDays />}
              label="Fecha de pago"
              value={formatDate(client.paymentDate)}
            />
            <DetailRow
              icon={<Clock3 />}
              label="Última actualización"
              value={formatDateTime(client.lastUpdatedAt)}
            />
          </dl>
        </article>
      </section>
      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">
          Detalle del periodo
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Minutos asignados"
            value={formatMinutes(client.assignedMinutes)}
          />
          <Metric
            label="Minutos consumidos"
            value={formatMinutes(client.consumedMinutes)}
          />
          <Metric
            label={exceeded > 0 ? 'Minutos excedidos' : 'Minutos disponibles'}
            value={formatMinutes(exceeded > 0 ? exceeded : remaining)}
            tone={exceeded > 0 ? 'text-rose-700' : undefined}
          />
          <Metric
            label="Periodo actual"
            value={`${formatDate(client.billingPeriodStart)} - ${formatDate(client.billingPeriodEnd)}`}
          />
        </dl>
      </section>
    </>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div>
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-slate-800">{value}</dd>
      </div>
    </div>
  )
}
function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className={`mt-1 text-lg font-semibold tracking-tight text-slate-900 ${tone ?? ''}`}
      >
        {value}
      </dd>
    </div>
  )
}
