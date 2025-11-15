"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine, Send, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { walletService } from "@/lib/api/wallet"
import type { Transaction } from "@/types/wallet"

export function RecentTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch transactions on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.UserId) {
        setIsLoading(false)
        return
      }

      try {
        const fetchedTransactions = await walletService.getRecentTransactions(user.UserId, 10)
        setTransactions(fetchedTransactions)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [user?.UserId])

  // Helper function to get icon based on transaction type
  const getTransactionIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('deposit')) return ArrowDownToLine
    if (lowerType.includes('withdrawal')) return ArrowUpFromLine
    if (lowerType.includes('transfer')) return Send
    if (lowerType.includes('exchange')) return ArrowRightLeft
    return Send // Default
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
          <CardTitle className="text-xl">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No transactions yet</p>
          <p className="text-sm mt-2">Your recent transactions will appear here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => {
          const TransactionIcon = getTransactionIcon(transaction.TransactionType)
          const isPositive = transaction.Amount > 0

          return (
            <div
              key={transaction.Id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="bg-secondary p-3 rounded-xl">
                <TransactionIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {transaction.Description || transaction.TransactionType}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(transaction.TransactionDate)}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${isPositive ? "text-green-600" : "text-foreground"}`}>
                  {isPositive ? "+" : "-"}
                  {formatCurrency(transaction.Amount, transaction.CurrencyCode)}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
