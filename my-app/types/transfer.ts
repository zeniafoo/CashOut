export interface Transfer {
  Id: string
  FromUserId: string
  ToUserId: string
  Amount: number
  CurrencyCode: string
  Status: string
  TransactionDate: string
}

export interface GetTransfersResponse {
  Success: boolean
  Message?: string
  Transfers: Transfer[]
}
