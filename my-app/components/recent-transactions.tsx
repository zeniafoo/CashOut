"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine, Send, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { walletService } from "@/lib/api/wallet"
import { transferService } from "@/lib/api/transfer"
import type { Transaction } from "@/types/wallet"

type GroupedTransaction = {
  id: string
  type: 'single' | 'exchange'
  transaction: Transaction
  exchangePair?: Transaction // For exchange transactions
}

export function RecentTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userNames, setUserNames] = useState<Record<string, string>>({})

  // Fetch transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.UserId) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch both transactions and transfers
        const [fetchedTransactions, transfers] = await Promise.all([
          walletService.getRecentTransactions(user.UserId, 20), // Get more to account for filtering
          transferService.getRecentTransfers(user.UserId, 20).catch(() => []) // Get transfers, ignore errors
        ])
        
        // Create a set of transfer identifiers (amount + currency + date within 5 seconds)
        const transferIdentifiers = new Set<string>()
        transfers.forEach(transfer => {
          const transferDate = new Date(transfer.TransactionDate).getTime()
          // Create identifier for both sender and receiver transactions
          const senderKey = `${transfer.Amount}-${transfer.CurrencyCode}-${Math.floor(transferDate / 5000)}`
          const receiverKey = `${transfer.Amount}-${transfer.CurrencyCode}-${Math.floor(transferDate / 5000)}`
          transferIdentifiers.add(senderKey)
          transferIdentifiers.add(receiverKey)
        })
        
        // Filter out transactions that match transfers
        const filteredTransactions = fetchedTransactions.filter((tx) => {
          const txDate = new Date(tx.TransactionDate).getTime()
          const txKey = `${Math.abs(tx.Amount)}-${tx.CurrencyCode}-${Math.floor(txDate / 5000)}`
          
          // Check if this transaction matches a transfer
          const isTransfer = transferIdentifiers.has(txKey)
          
          if (isTransfer) {
            console.log('[Recent Transactions] Filtered out transfer transaction:', {
              type: tx.TransactionType,
              description: tx.Description,
              amount: tx.Amount,
              currency: tx.CurrencyCode
            })
          }
          
          return !isTransfer
        }).slice(0, 10) // Limit to 10 after filtering
        
        console.log('[Recent Transactions] Filtered transactions:', filteredTransactions.length)
        setTransactions(filteredTransactions)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [user?.UserId])

  // Group exchange transactions together using heuristics
  useEffect(() => {
    if (transactions.length === 0) {
      setGroupedTransactions([])
      return
    }

    const grouped: GroupedTransaction[] = []
    const processed = new Set<number>()

    transactions.forEach((transaction, index) => {
      if (processed.has(index)) return

      // Heuristic: If negative amount (withdrawal), look for matching positive (deposit) with:
      // 1. Different currency
      // 2. Same timestamp (within 2 seconds)
      // 3. Could be a currency exchange
      if (transaction.Amount < 0) {
        const matchingDeposit = transactions.find((t, i) => {
          if (i === index || processed.has(i)) return false

          const timeDiff = Math.abs(
            new Date(t.TransactionDate).getTime() - new Date(transaction.TransactionDate).getTime()
          )

          return (
            t.Amount > 0 && // Positive amount (deposit)
            t.CurrencyCode !== transaction.CurrencyCode && // Different currency
            timeDiff <= 2000 // Within 2 seconds
          )
        })

        if (matchingDeposit) {
          const matchIndex = transactions.indexOf(matchingDeposit)
          processed.add(index)
          processed.add(matchIndex)

          // This looks like an exchange - group them together
          grouped.push({
            id: `exchange-${transaction.Id}-${matchingDeposit.Id}`,
            type: 'exchange',
            transaction: transaction,
            exchangePair: matchingDeposit
          })
        } else {
          // No matching pair found, treat as regular withdrawal
          processed.add(index)
          grouped.push({
            id: `single-${transaction.Id}`,
            type: 'single',
            transaction: transaction
          })
        }
      } else {
        // Positive amount - only add if not already processed as part of an exchange
        if (!processed.has(index)) {
          processed.add(index)
          grouped.push({
            id: `single-${transaction.Id}`,
            type: 'single',
            transaction: transaction
          })
        }
      }
    })

    setGroupedTransactions(grouped)
  }, [transactions])

  // Helper function to get icon based on transaction type
  const getTransactionIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('deposit')) return ArrowDownToLine
    if (lowerType.includes('withdrawal')) return ArrowUpFromLine
    if (lowerType.includes('transfer') || lowerType.includes('sent') || lowerType.includes('received')) return Send
    if (lowerType.includes('exchange') || lowerType.includes('conversion')) return ArrowRightLeft
    return Send // Default
  }

  // Helper function to generate detailed transaction description
  const getDetailedDescription = (transaction: Transaction): { title: string; subtitle: string } => {
    const type = transaction.TransactionType.toLowerCase()
    const amount = Math.abs(transaction.Amount)
    const currency = transaction.CurrencyCode
    const isPositive = transaction.Amount > 0

    // DEPOSIT
    if (type.includes('deposit')) {
      return {
        title: 'Deposit',
        subtitle: transaction.Description || 'Added funds to wallet'
      }
    }

    // WITHDRAWAL/PAYMENT
    if (type.includes('withdrawal') || type.includes('withdraw')) {
      return {
        title: 'Payment',
        subtitle: transaction.Description || 'Withdrew funds from wallet'
      }
    }

    // TRANSFER (Sent or Received)
    if (type.includes('transfer') || type.includes('sent') || type.includes('received')) {
      // Extract name from description if it contains "from" or "to"
      let displayDescription = transaction.Description || ''

      // Check if description contains "Sent to [Name]" or "Received from [Name]"
      const sentMatch = displayDescription.match(/Sent to (.+)/)
      const receivedMatch = displayDescription.match(/Received from (.+)/)

      if (isPositive) {
        // Money received
        const fromName = receivedMatch ? receivedMatch[1] : null
        return {
          title: 'Money Received',
          subtitle: fromName ? `From ${fromName}` : (displayDescription || `Received ${formatCurrency(amount, currency)}`)
        }
      } else {
        // Money sent
        const toName = sentMatch ? sentMatch[1] : null
        return {
          title: 'Money Sent',
          subtitle: toName ? `To ${toName}` : (displayDescription || `Sent ${formatCurrency(amount, currency)}`)
        }
      }
    }

    // EXCHANGE/CONVERSION
    if (type.includes('exchange') || type.includes('conversion')) {
      if (isPositive) {
        return {
          title: 'Currency Exchange',
          subtitle: transaction.Description || `Received from exchange`
        }
      } else {
        return {
          title: 'Currency Exchange',
          subtitle: transaction.Description || `Converted to another currency`
        }
      }
    }

    // REFERRAL BONUS
    if (type.includes('referral') || type.includes('bonus')) {
      return {
        title: 'Referral Bonus',
        subtitle: transaction.Description || 'Referral reward credited'
      }
    }

    // DEFAULT
    return {
      title: transaction.TransactionType,
      subtitle: transaction.Description || 'Transaction'
    }
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffInHours < 48) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }
  // Map currency codes to their symbols
  const getCurrencySymbol = (currency: string): string => {
    const currencyMap: Record<string, string> = {
      'SGD': 'SGD$',
      'USD': '$',
      'MYR': 'RM',
      'KRW': '₩',
      'JPY': '¥',
    }
    const upperCurrency = currency?.toUpperCase() || 'USD'
    return currencyMap[upperCurrency] || upperCurrency
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = getCurrencySymbol(currency)
    const absAmount = Math.abs(amount)
    
    // For JPY and KRW, typically no decimal places
    if (currency?.toUpperCase() === 'JPY' || currency?.toUpperCase() === 'KRW') {
      const wholeAmount = absAmount.toLocaleString("en-US", {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      })
      return `${symbol}${wholeAmount}`
    }
    
    // For other currencies, show 2 decimal places
    const formattedAmount = absAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    
    return `${symbol}${formattedAmount}`
  }

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6 sm:py-8">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (groupedTransactions.length === 0 && !isLoading) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="py-6 sm:py-8 text-center text-muted-foreground">
          <p className="text-sm sm:text-base">No transactions yet</p>
          <p className="text-xs sm:text-sm mt-2">Your recent transactions will appear here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {groupedTransactions.map((grouped) => {
          if (grouped.type === 'exchange' && grouped.exchangePair) {
            // Render exchange transaction as a single entry
            const fromTransaction = grouped.transaction // withdrawal (negative)
            const toTransaction = grouped.exchangePair // deposit (positive)
            const fromAmount = Math.abs(fromTransaction.Amount)
            const toAmount = Math.abs(toTransaction.Amount)

            return (
              <div
                key={grouped.id}
                className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="bg-secondary p-2 sm:p-3 rounded-xl">
                  <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm">Currency Exchange</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {formatCurrency(fromAmount, fromTransaction.CurrencyCode)} → {formatCurrency(toAmount, toTransaction.CurrencyCode)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    {formatDate(fromTransaction.TransactionDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs sm:text-sm text-primary">
                    {formatCurrency(toAmount, toTransaction.CurrencyCode)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    -{formatCurrency(fromAmount, fromTransaction.CurrencyCode)}
                  </p>
                </div>
              </div>
            )
          } else {
            // Render regular single transaction
            const transaction = grouped.transaction
            const TransactionIcon = getTransactionIcon(transaction.TransactionType)
            const isPositive = transaction.Amount > 0
            const { title, subtitle } = getDetailedDescription(transaction)

            return (
              <div
                key={grouped.id}
                className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="bg-secondary p-2 sm:p-3 rounded-xl">
                  <TransactionIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm truncate">
                    {title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{formatDate(transaction.TransactionDate)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-xs sm:text-sm ${isPositive ? "text-green-600" : "text-foreground"}`}>
                    {isPositive ? "+" : "-"}
                    {formatCurrency(transaction.Amount, transaction.CurrencyCode)}
                  </p>
                </div>
              </div>
            )
          }
        })}
      </CardContent>
    </Card>
  )
}
