"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencySelector } from "@/components/currency-selector"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Building2, Smartphone, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { walletService } from "@/lib/api/wallet"
import type { CurrencyCode } from "@/types/wallet"

const depositMethods = [
  { id: "card", label: "Credit/Debit Card", icon: CreditCard },
  { id: "bank", label: "Bank Transfer", icon: Building2 },
  { id: "ewallet", label: "E-Wallet", icon: Smartphone },
]

export function DepositForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<CurrencyCode>("SGD")
  const [method, setMethod] = useState("card")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.UserId) {
      toast({
        title: "Error",
        description: "User not authenticated. Please log in again.",
        variant: "destructive",
      })
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Call the actual wallet API to update balance
      const response = await walletService.updateWallet(
        user.UserId,
        currency,
        parseFloat(amount)
      )

      if (response.Success) {
        setIsLoading(false)
        setIsSuccess(true)

        toast({
          title: "Deposit Successful!",
          description: `${currency} ${amount} has been added to your account.${response.NewBalance ? ` New balance: ${currency} ${response.NewBalance}` : ''}`,
        })

        // Redirect after success
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        throw new Error(response.Message || 'Deposit failed')
      }
    } catch (error) {
      setIsLoading(false)
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "An error occurred during deposit",
        variant: "destructive",
      })
    }
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
          <h2 className="text-2xl font-bold mb-2">Deposit Successful!</h2>
          <p className="text-muted-foreground mb-6">
            {currency} {amount} has been added to your account
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Deposit Details</CardTitle>
        <CardDescription>Enter the amount and select your preferred deposit method</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDeposit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  step="0.01"
                  className="h-12 text-lg"
                />
              </div>
              <CurrencySelector value={currency} onChange={setCurrency} variant="compact" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Deposit Method</Label>
            <RadioGroup value={method} onValueChange={setMethod} className="space-y-3">
              {depositMethods.map((depositMethod) => (
                <div key={depositMethod.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={depositMethod.id} id={depositMethod.id} />
                  <Label
                    htmlFor={depositMethod.id}
                    className="flex items-center gap-3 cursor-pointer flex-1 p-4 rounded-lg border-2 hover:bg-muted/50 transition-colors"
                  >
                    <depositMethod.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{depositMethod.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Deposit Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">
                {currency} {amount || "0.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing Fee</span>
              <span className="font-semibold text-green-600">Free</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">
                  {currency} {amount || "0.00"}
                </span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || !amount}>
            {isLoading ? "Processing..." : "Confirm Deposit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
