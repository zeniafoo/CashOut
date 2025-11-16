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
import { useNotifications } from "@/contexts/NotificationContext"
import { walletService } from "@/lib/api/wallet"
import { checkAndCompleteReferral } from "@/lib/referral-helper"
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
  const { addNotification } = useNotifications()
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<CurrencyCode>("SGD")
  const [method, setMethod] = useState("card")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Credit card fields
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")

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

    // If credit card is selected, require all card fields with proper validation
    if (method === "card") {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        toast({
          title: "Missing Card Details",
          description: "Please fill in all credit card fields.",
          variant: "destructive",
        })
        return
      }

      // Validate card number is exactly 16 digits
      if (cardNumber.length !== 16) {
        toast({
          title: "Invalid Card Number",
          description: "Card number must be exactly 16 digits.",
          variant: "destructive",
        })
        return
      }

      // Validate cardholder name is at least 3 characters
      if (cardName.length < 3) {
        toast({
          title: "Invalid Cardholder Name",
          description: "Cardholder name must be at least 3 characters.",
          variant: "destructive",
        })
        return
      }

      // Validate expiry date format MM/YY
      if (expiryDate.length !== 5 || !expiryDate.includes("/")) {
        toast({
          title: "Invalid Expiry Date",
          description: "Expiry date must be in MM/YY format.",
          variant: "destructive",
        })
        return
      }

      // Validate CVV is exactly 3 digits
      if (cvv.length !== 3) {
        toast({
          title: "Invalid CVV",
          description: "CVV must be exactly 3 digits.",
          variant: "destructive",
        })
        return
      }
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
        // Check and complete referral if this is user's first transaction
        await checkAndCompleteReferral(user.UserId)

        // Add notification
        addNotification(
          "deposit",
          "Deposit Successful",
          `Your deposit has been processed successfully`,
          amount,
          currency
        )

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
        <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12 text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="bg-green-100 p-3 sm:p-4 rounded-full">
              <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Deposit Successful!</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            {currency} {amount} has been added to your account
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Deposit Details</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Enter the amount and select your preferred deposit method</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDeposit} className="space-y-4 sm:space-y-6">
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
                <div key={depositMethod.id} className="space-y-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <RadioGroupItem value={depositMethod.id} id={depositMethod.id} />
                    <Label
                      htmlFor={depositMethod.id}
                      className="flex items-center gap-2 sm:gap-3 cursor-pointer flex-1 p-3 sm:p-4 rounded-lg border-2 hover:bg-muted/50 transition-colors"
                    >
                      <depositMethod.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <span className="font-medium text-sm sm:text-base">{depositMethod.label}</span>
                    </Label>
                  </div>

                  {/* Credit Card Details - Show below card option when selected */}
                  {depositMethod.id === "card" && method === "card" && (
                    <div className="ml-7 sm:ml-9 space-y-3 sm:space-y-4 p-3 sm:p-4 border-2 rounded-lg bg-muted/20">
                      <h3 className="font-semibold text-xs sm:text-sm">Card Details</h3>

                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          value={cardNumber.replace(/(.{4})/g, "$1 ").trim()}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "")
                            if (value.length <= 16) {
                              setCardNumber(value)
                            }
                          }}
                          maxLength={19}
                          required
                        />

                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardName">Cardholder Name</Label>
                        <Input
                          id="cardName"
                          type="text"
                          value={cardName}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^A-Za-z\s]/g, "")
                            setCardName(value.toUpperCase())
                          }}
                          minLength={3}
                          required
                        />

                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            type="text"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, "")
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + "/" + value.slice(2, 4)
                              }
                              if (value.length <= 5) {
                                setExpiryDate(value)
                              }
                            }}
                            maxLength={5}
                            minLength={5}
                            required
                          />
                          
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            type="text"
                            placeholder="123"
                            value={cvv}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              if (value.length <= 3) {
                                setCvv(value)
                              }
                            }}
                            maxLength={3}
                            minLength={3}
                            required
                          />
                          
                        </div>
                      </div>
                    </div>
                  )}
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
