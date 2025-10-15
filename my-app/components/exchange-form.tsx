"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencySelector } from "@/components/currency-selector"
import { ArrowDownUp, TrendingUp, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock exchange rates (in production, fetch from OutSystems API)
const exchangeRates: Record<string, Record<string, number>> = {
  SGD: { SGD: 1, MYR: 3.45, USD: 0.74, JPY: 110.5, KRW: 990 },
  MYR: { SGD: 0.29, MYR: 1, USD: 0.21, JPY: 32, KRW: 287 },
  USD: { SGD: 1.35, MYR: 4.65, USD: 1, JPY: 149, KRW: 1335 },
  JPY: { SGD: 0.009, MYR: 0.031, USD: 0.0067, JPY: 1, KRW: 8.95 },
  KRW: { SGD: 0.001, MYR: 0.0035, USD: 0.00075, JPY: 0.112, KRW: 1 },
}

export function ExchangeForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [fromCurrency, setFromCurrency] = useState("SGD")
  const [toCurrency, setToCurrency] = useState("USD")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Calculate exchange when amount or currencies change
  useEffect(() => {
    if (fromAmount && fromCurrency && toCurrency) {
      const rate = exchangeRates[fromCurrency][toCurrency]
      const result = (Number.parseFloat(fromAmount) * rate).toFixed(2)
      setToAmount(result)
    } else {
      setToAmount("")
    }
  }, [fromAmount, fromCurrency, toCurrency])

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setFromAmount(toAmount)
  }

  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call to OutSystems backend
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    setIsSuccess(true)

    toast({
      title: "Exchange Successful!",
      description: `Exchanged ${fromCurrency} ${fromAmount} to ${toCurrency} ${toAmount}`,
    })

    // Redirect after success
    setTimeout(() => {
      router.push("/dashboard")
    }, 2000)
  }

  if (isSuccess) {
    return (
      <Card className="border-2">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Exchange Successful!</h2>
          <p className="text-muted-foreground mb-2">
            You exchanged {fromCurrency} {fromAmount}
          </p>
          <p className="text-lg font-semibold text-primary mb-6">
            Received {toCurrency} {toAmount}
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </CardContent>
      </Card>
    )
  }

  const currentRate = fromCurrency && toCurrency ? exchangeRates[fromCurrency][toCurrency] : 0

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Exchange Currency</CardTitle>
        <CardDescription>Convert your money between different currencies</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleExchange} className="space-y-6">
          {/* From Currency */}
          <div className="space-y-2">
            <Label htmlFor="from-amount">From</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="from-amount"
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  className="h-12 text-lg"
                />
              </div>
              <CurrencySelector value={fromCurrency} onChange={setFromCurrency} variant="compact" />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 border-2 bg-transparent"
              onClick={handleSwapCurrencies}
            >
              <ArrowDownUp className="h-5 w-5" />
            </Button>
          </div>

          {/* To Currency */}
          <div className="space-y-2">
            <Label htmlFor="to-amount">To</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="to-amount"
                  type="number"
                  placeholder="0.00"
                  value={toAmount}
                  readOnly
                  className="h-12 text-lg bg-muted"
                />
              </div>
              <CurrencySelector value={toCurrency} onChange={setToCurrency} variant="compact" />
            </div>
          </div>

          {/* Exchange Rate Info */}
          {fromAmount && (
            <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Current Exchange Rate</span>
              </div>
              <div className="text-lg font-semibold">
                1 {fromCurrency} = {currentRate.toFixed(4)} {toCurrency}
              </div>
            </div>
          )}

          {/* Exchange Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Exchange Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You send</span>
              <span className="font-semibold">
                {fromCurrency} {fromAmount || "0.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange fee</span>
              <span className="font-semibold text-green-600">Free</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">You receive</span>
                <span className="font-bold text-lg text-primary">
                  {toCurrency} {toAmount || "0.00"}
                </span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || !fromAmount}>
            {isLoading ? "Processing..." : "Confirm Exchange"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
