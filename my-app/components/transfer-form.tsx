"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CurrencySelector } from "@/components/currency-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Phone, Users, QrCode, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { QRScanner } from "@/components/qr-scanner"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { checkAndCompleteReferral } from "@/lib/referral-helper"
import { transferService } from "@/lib/api/transfer"
import { authService } from "@/lib/api/auth"


// Mock recent contacts
const recentContacts = [
  { id: 1, name: "John Doe", phone: "+65 9123 4567", avatar: "JD" },
  { id: 2, name: "Sarah Lee", phone: "+65 8234 5678", avatar: "SL" },
  { id: 3, name: "Mike Chen", phone: "+65 9345 6789", avatar: "MC" },
  { id: 4, name: "Emily Tan", phone: "+65 8456 7890", avatar: "ET" },
]

interface ScannedMerchant {
  merchantId: string
  merchantName: string
  type: string
}

export function TransferForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [transferMethod, setTransferMethod] = useState("phone")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("SGD")
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedContact, setSelectedContact] = useState<(typeof recentContacts)[0] | null>(null)
  const [scannedMerchant, setScannedMerchant] = useState<ScannedMerchant | null>(null)
  const [isQRScanned, setIsQRScanned] = useState(false)

  const handleSelectContact = (contact: (typeof recentContacts)[0]) => {
    setSelectedContact(contact)
    setRecipient(contact.phone)
    setTransferMethod("phone")
  }

  const handleQRScan = (data: string) => {
    try {
      const parsedData: ScannedMerchant = JSON.parse(data)

      if (parsedData.type === "external_payment") {
        setScannedMerchant(parsedData)
        setRecipient(parsedData.merchantName)
        setIsQRScanned(true)

        toast({
          title: "QR Code Scanned!",
          description: `Merchant: ${parsedData.merchantName}`,
        })
      } else {
        toast({
          title: "Invalid QR Code",
          description: "This QR code is not valid for payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Scan Error",
        description: "Failed to read QR code data",
        variant: "destructive",
      })
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (transferMethod === "qr" && scannedMerchant) {
        // Validate user is logged in
        if (!user?.UserId) {
          toast({
            title: "Authentication Required",
            description: "Please log in to make a payment",
            variant: "destructive",
          })
          setIsLoading(false)
          router.push("/")
          return
        }

        // Generate unique transaction ID
        const transactionId = `TXN${Date.now()}`

        const paymentPayload = {
          accountId: scannedMerchant.merchantId,
          amount: parseFloat(amount),
          narrative: note || "QR Payment",
          transactionId,
          userId: user.UserId,
          currencyCode: currency,
        }

        console.log("[Transfer Form] Sending payment request:", paymentPayload)

        // Call external payment API (includes wallet deduction)
        const response = await fetch("/api/external-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentPayload),
        })

        const responseData = await response.json()

        if (!response.ok) {
          // Handle specific error cases
          if (responseData.error === "Insufficient balance") {
            toast({
              title: "Insufficient Balance",
              description: `You need ${currency} ${amount} but only have ${currency} ${responseData.currentBalance}`,
              variant: "destructive",
            })
          } else {
            toast({
              title: "Payment Failed",
              description: responseData.error || "An error occurred during payment",
              variant: "destructive",
            })
          }
          setIsLoading(false)
          return
        }

        // Check and complete referral if this is user's first transaction
        await checkAndCompleteReferral(user.UserId)

        // Add notification
        addNotification(
          "transfer_sent",
          "Payment Sent",
          `Payment sent to ${scannedMerchant.merchantName}`,
          amount,
          currency
        )

        setIsSuccess(true)
        toast({
          title: "Payment Successful!",
          description: `${currency} ${amount} sent to ${scannedMerchant.merchantName}`,
        })
      } else if (transferMethod === "userId") {
        // UserId transfer logic - real API call
        // Validation is handled by OutSystems backend
        
        if (!user?.UserId) {
          toast({
            title: "Authentication Required",
            description: "Please log in to make a transfer",
            variant: "destructive",
          })
          setIsLoading(false)
          router.push("/")
          return
        }
      
        // Send transfer request
        const transferRequest = {
          FromUserId: user.UserId,
          ToUserId: recipient.trim(),
          CurrencyCode: currency,
          Amount: parseFloat(amount),
        }
      
        console.log("[Transfer Form] Sending transfer request:", transferRequest)
      
        try {
          const response = await transferService.sendFund(transferRequest)
      
          if (!response.Success) {
            toast({
              title: "Transfer Failed",
              description: response.Message || "An error occurred during transfer",
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }
      
          setIsSuccess(true)
          toast({
            title: "Transfer Successful!",
            description: `${currency} ${amount} sent to ${recipient.trim()}`,
          })
        } catch (error) {
          toast({
            title: "Transfer Failed",
            description: error instanceof Error ? error.message : "An error occurred",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      } else {
        // Phone transfer - lookup UserId first
        if (!user?.UserId) {
          toast({
            title: "Authentication Required",
            description: "Please log in to make a transfer",
            variant: "destructive",
          })
          setIsLoading(false)
          router.push("/")
          return
        }
      
        if (!recipient || !recipient.trim()) {
          toast({
            title: "Recipient Required",
            description: "Please enter a phone number",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      
        // Lookup recipient UserId by phone
        let recipientUserId: string | null = null
      
        try {
          recipientUserId = await authService.findUserByPhone(recipient.trim())
      
          if (!recipientUserId) {
            toast({
              title: "Recipient Not Found",
              description: "No user found with this phone number. Please check and try again.",
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }
      
        } catch (error) {
          console.error('[Transfer Form] Phone lookup error:', error)
          toast({
            title: "Lookup Failed",
            description: error instanceof Error ? error.message : "Could not find recipient. Please check the phone number and try again.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      
        // Send transfer request
        const transferRequest = {
          FromUserId: user.UserId,
          ToUserId: recipientUserId,
          CurrencyCode: currency,
          Amount: parseFloat(amount),
        }
      
        console.log("[Transfer Form] Sending transfer request:", transferRequest)
      
        try {
          const response = await transferService.sendFund(transferRequest)
      
          if (!response.Success) {
            toast({
              title: "Transfer Failed",
              description: response.Message || "An error occurred during transfer",
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }

          // Check and complete referral if this is user's first transaction
          await checkAndCompleteReferral(user.UserId)

          // Add notification
          addNotification(
            "transfer_sent",
            "Transfer Sent",
            `Money sent to ${recipient}`,
            amount,
            currency
          )
      
          setIsSuccess(true)
          toast({
            title: "Transfer Successful!",
            description: `${currency} ${amount} sent to ${recipient}`,
          })
        } catch (error) {
          toast({
            title: "Transfer Failed",
            description: error instanceof Error ? error.message : "An error occurred",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }

      // Redirect after success
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
          <h2 className="text-2xl font-bold mb-2">Transfer Successful!</h2>
          <p className="text-muted-foreground mb-2">
            You sent {currency} {amount}
          </p>
          <p className="text-lg font-semibold text-primary mb-6">to {recipient}</p>
          {note && (
            <div className="bg-muted/50 p-3 rounded-lg max-w-sm mx-auto mb-6">
              <p className="text-sm text-muted-foreground">Note: {note}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recent Contacts */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {recentContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleSelectContact(contact)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">{contact.avatar}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-center line-clamp-1">{contact.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Form */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
          <CardDescription>Enter recipient details and amount to transfer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransfer} className="space-y-6">
            {/* Recipient Selection */}
            <div className="space-y-3">
              <Label>Send to</Label>
              <Tabs value={transferMethod} onValueChange={setTransferMethod}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="phone" className="gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </TabsTrigger>
                  <TabsTrigger value="userId" className="gap-2">
                    <Key className="h-4 w-4" />
                    UserId
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="phone" className="mt-4">
                  <Input
                    type="tel"
                    placeholder="+65 9123 4567"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    className="h-11"
                  />
                </TabsContent>
                <TabsContent value="userId" className="mt-4">
                  <Input
                    type="text"
                    placeholder="0000000000"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    className="h-11"
                  />
                </TabsContent>
                <TabsContent value="qr" className="mt-4">
                  {!isQRScanned ? (
                    <QRScanner onScan={handleQRScan} />
                  ) : (
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-green-900">Merchant Scanned</p>
                          <p className="text-sm text-green-700">{scannedMerchant?.merchantName}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsQRScanned(false)
                            setScannedMerchant(null)
                            setRecipient("")
                          }}
                        >
                          Scan Again
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Amount */}
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
                    min="0.01"
                    step="0.01"
                    className="h-12 text-lg"
                  />
                </div>
                <CurrencySelector value={currency} onChange={setCurrency} variant="compact" />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a message..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Transfer Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">Transfer Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-semibold">{recipient || "Not specified"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  {currency} {amount || "0.00"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transfer fee</span>
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

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading || !recipient || !amount}
            >
              {isLoading ? "Processing..." : "Confirm Transfer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
