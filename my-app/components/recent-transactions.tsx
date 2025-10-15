"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownToLine, ArrowRightLeft, Send } from "lucide-react"

const transactions = [
  {
    id: 1,
    type: "transfer",
    description: "Transfer to John Doe",
    amount: -150.0,
    currency: "SGD",
    date: "Today, 2:30 PM",
    icon: Send,
  },
  {
    id: 2,
    type: "deposit",
    description: "Bank deposit",
    amount: 500.0,
    currency: "SGD",
    date: "Yesterday, 10:15 AM",
    icon: ArrowDownToLine,
  },
  {
    id: 3,
    type: "exchange",
    description: "SGD to USD exchange",
    amount: -200.0,
    currency: "SGD",
    date: "Dec 10, 3:45 PM",
    icon: ArrowRightLeft,
  },
]

export function RecentTransactions() {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(Math.abs(amount))
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="bg-secondary p-3 rounded-xl">
              <transaction.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{transaction.description}</p>
              <p className="text-xs text-muted-foreground">{transaction.date}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${transaction.amount > 0 ? "text-green-600" : "text-foreground"}`}>
                {transaction.amount > 0 ? "+" : "-"}
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
