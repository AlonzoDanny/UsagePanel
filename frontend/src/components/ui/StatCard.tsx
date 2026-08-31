import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  accent?: 'slate' | 'amber' | 'rose'
}

export function StatCard({
  label,
  value,
  icon,
  accent = 'slate',
}: StatCardProps) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <span className={`rounded-lg p-2.5 ${colors[accent]}`}>{icon}</span>
      </div>
    </article>
  )
}
