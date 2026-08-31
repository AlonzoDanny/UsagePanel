import { AlertCircle, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
      Cargando clientes...
    </div>
  )
}
export function EmptyState({
  message = 'No hay clientes que coincidan con los filtros.',
}: {
  message?: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <Inbox className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-3 text-sm font-medium text-slate-700">{message}</p>
      <p className="mt-1 text-sm text-slate-500">
        Ajusta la búsqueda o los filtros para continuar.
      </p>
    </div>
  )
}
export function ErrorState({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <AlertCircle className="h-5 w-5 shrink-0" />
      {children}
    </div>
  )
}
