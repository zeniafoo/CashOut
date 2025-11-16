"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Loader2, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { transferService } from "@/lib/api/transfer"
import type { Transfer } from "@/types/transfer"

export function RecentTransfers() {
  const { user } = useAuth()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch transfers on mount
  useEffect(() => {
    const fetchTransfers = async () => {
      if (!user?.UserId) {
        setIsLoading(false)
        return
      }

      try {
        const fetchedTransfers = await transferService.getRecentTransfers(user.UserId, 10)
        setTransfers(fetchedTransfers)
      } catch (error) {
        console.error('Error fetching transfers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransfers()
  }, [user?.UserId])

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    // Handle null, undefined, or empty strings
    if (!dateString || dateString.trim() === '') {
      return 'Date not available'
    }

    const date = new Date(dateString)
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return 'Date not available'
    }

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
          <CardTitle className="text-xl">Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (transfers.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">Recent Transfers</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No transfers yet</p>
          <p className="text-sm mt-2">Your recent transfers will appear here</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Recent Transfers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transfers.map((transfer) => {
          const isOutgoing = transfer.FromUserId === user?.UserId
          const otherUserId = isOutgoing ? transfer.ToUserId : transfer.FromUserId

          return (
            <div
              key={transfer.Id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="bg-secondary p-3 rounded-xl">
                {isOutgoing ? (
                  <ArrowRight className="h-5 w-5 text-primary" />
                ) : (
                  <Send className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {isOutgoing ? `To: ${otherUserId.substring(0, 8)}...` : `From: ${otherUserId.substring(0, 8)}...`}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(transfer.TransactionDate)}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${isOutgoing ? "text-foreground" : "text-green-600"}`}>
                  {isOutgoing ? "-" : "+"}
                  {formatCurrency(transfer.Amount, transfer.CurrencyCode)}
                </p>
                <p className="text-xs text-muted-foreground">{transfer.Status}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}