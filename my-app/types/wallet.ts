// Wallet API Types

export type CurrencyCode = 'SGD' | 'USD' | 'MYR' | 'KRW' | 'JPY'

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['SGD', 'USD', 'MYR', 'KRW', 'JPY']

export interface Wallet {
  WalletId: string
  UserId: string
  Balance: number
  CurrencyCode: string
  CreatedAt?: string
}

export interface CreateWalletRequest {
  UserId: string
  CurrencyCode: string
}

export interface CreateWalletResponse {
  Success: boolean
  Message: string
  WalletId?: string
  Wallet?: Wallet
}

export interface GetWalletResponse {
  Success: boolean
  Message: string
  Wallet?: Wallet
}

export interface UpdateWalletRequest {
  UserId: string
  CurrencyCode: string
  Amount: number
}

export interface UpdateWalletResponse {
  Success: boolean
  Message: string
  NewBalance?: number
}

export interface GetAllWalletsResponse {
  Success: boolean
  Message: string
  Wallets?: Wallet[]
}
