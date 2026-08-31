import {
  LIMIT_USAGE_PERCENTAGE,
  WARNING_USAGE_PERCENTAGE,
} from '../../config/constants'
import { formatPercentage } from '../../utils/formatters'

interface UsageProgressBarProps {
  percentage: number
  size?: 'default' | 'large'
}

export function UsageProgressBar({
  percentage,
  size = 'default',
}: UsageProgressBarProps) {
  const color =
    percentage > LIMIT_USAGE_PERCENTAGE
      ? 'bg-rose-500'
      : percentage >= WARNING_USAGE_PERCENTAGE
        ? 'bg-amber-500'
        : 'bg-emerald-500'
  const height = size === 'large' ? 'h-4' : 'h-2'

  return (
    <div
      className="min-w-[120px]"
      aria-label={`Consumo: ${formatPercentage(percentage)}`}
    >
      <div className={`overflow-hidden rounded-full bg-slate-100 ${height}`}>
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(percentage, LIMIT_USAGE_PERCENTAGE)}%` }}
        />
      </div>
    </div>
  )
}
