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
import { CheckCircle2, User, Phone, Mail, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Mock recent contacts
const recentContacts = [
  { id: 1, name: "John Doe", phone: "+65 9123 4567", avatar: "JD" },
  { id: 2, name: "Sarah Lee", phone: "+65 8234 5678", avatar: "SL" },
  { id: 3, name: "Mike Chen", phone: "+65 9345 6789", avatar: "MC" },
  { id: 4, name: "Emily Tan", phone: "+65 8456 7890", avatar: "ET" },
]

export function TransferForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [transferMethod, setTransferMethod] = useState("phone")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("SGD")
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedContact, setSelectedContact] = useState<(typeof recentContacts)[0] | null>(null)

  const handleSelectContact = (contact: (typeof recentContacts)[0]) => {
    setSelectedContact(contact)
    setRecipient(contact.phone)
    setTransferMethod("phone")
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call to OutSystems backend
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    setIsSuccess(true)

    toast({
      title: "Transfer Successful!",
      description: `${currency} ${amount} sent to ${recipient}`,
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
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="username" className="gap-2">
                    <User className="h-4 w-4" />
                    Username
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
                <TabsContent value="email" className="mt-4">
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    className="h-11"
                  />
                </TabsContent>
                <TabsContent value="username" className="mt-4">
                  <Input
                    type="text"
                    placeholder="@username"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                    className="h-11"
                  />
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
