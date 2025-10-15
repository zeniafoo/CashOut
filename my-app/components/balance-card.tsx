"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, TrendingUp } from "lucide-react"
import { CurrencySelector } from "@/components/currency-selector"

const balances = {
  SGD: 12450.75,
  MYR: 8320.5,
  USD: 5680.25,
  JPY: 125000,
  KRW: 7500000,
}

export function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<keyof typeof balances>("SGD")

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
    }).format(amount)
  }

  return (
    <Card className="border-2 shadow-lg bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full translate-y-24 -translate-x-24" />
      <CardContent className="pt-6 pb-6 relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-primary-foreground/80 text-sm mb-1">Total Balance</p>
            <div className="flex items-center gap-3">
              {showBalance ? (
                <h2 className="text-4xl font-bold tracking-tight">
                  {formatCurrency(balances[selectedCurrency], selectedCurrency)}
                </h2>
              ) : (
                <h2 className="text-4xl font-bold tracking-tight">••••••</h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalance(!showBalance)}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <CurrencySelector value={selectedCurrency} onChange={setSelectedCurrency} />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 bg-primary-foreground/10 px-3 py-1.5 rounded-full">
            <TrendingUp className="h-4 w-4 text-green-300" />
            <span className="font-semibold text-green-300">+2.5%</span>
            <span className="text-primary-foreground/70">this month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
