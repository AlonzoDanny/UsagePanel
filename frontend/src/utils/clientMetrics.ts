import {
  LIMIT_USAGE_PERCENTAGE,
  WARNING_USAGE_PERCENTAGE,
} from '../config/constants'
import type { UsageStatus } from '../types/client'

export function calculateUsagePercentage(
  consumedMinutes: number,
  assignedMinutes: number,
): number {
  if (assignedMinutes <= 0) return 0
  return (consumedMinutes / assignedMinutes) * 100
}

export function calculateRemainingMinutes(
  consumedMinutes: number,
  assignedMinutes: number,
): number {
  return Math.max(assignedMinutes - consumedMinutes, 0)
}

export function calculateExceededMinutes(
  consumedMinutes: number,
  assignedMinutes: number,
): number {
  return Math.max(consumedMinutes - assignedMinutes, 0)
}

export function getUsageStatus(percentage: number): UsageStatus {
  if (percentage > LIMIT_USAGE_PERCENTAGE) return 'exceeded'
  if (percentage >= LIMIT_USAGE_PERCENTAGE) return 'limit'
  if (percentage >= WARNING_USAGE_PERCENTAGE) return 'high'
  return 'normal'
}
