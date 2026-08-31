export type PlanType = 'Starter' | 'Estándar' | 'Pro'

export type PaymentStatus = 'paid' | 'pending' | 'overdue'

export type UsageStatus = 'normal' | 'high' | 'limit' | 'exceeded'

export interface Client {
  id: string
  companyName: string
  representativeName: string
  plan: PlanType
  assignedMinutes: number
  consumedMinutes: number
  paymentDate: string
  paymentStatus: PaymentStatus
  billingPeriodStart: string
  billingPeriodEnd: string
  lastUpdatedAt: string
}

export type ClientSortField =
  | 'companyName'
  | 'assignedMinutes'
  | 'consumedMinutes'
  | 'usagePercentage'
  | 'paymentDate'

export type SortDirection = 'asc' | 'desc'
