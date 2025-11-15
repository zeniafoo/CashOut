// Notification Types

export type NotificationType = 'transfer_received' | 'transfer_sent' | 'deposit' | 'exchange' | 'referral_bonus'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  amount?: string
  currency?: string
  timestamp: Date
  read: boolean
}
