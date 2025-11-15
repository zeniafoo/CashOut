"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/lib/api/auth"
import { User, Mail, Phone, Share2, LogOut, Copy, Check, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { User as UserType } from "@/types/auth"

export function ProfilePage() {
  const router = useRouter()
  const { user: contextUser, logout } = useAuth()
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(contextUser)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!contextUser?.UserId) {
        router.push("/")
        return
      }

      try {
        setIsLoading(true)
        const response = await authService.getUser(contextUser.UserId)

        if (response.Found) {
          const updatedUser: UserType = {
            UserId: contextUser.UserId,
            Name: response.Name,
            Email: response.Email,
            PhoneNumber: response.PhoneNumber,
            ReferralCode: response.ReferralCode,
          }
          setUser(updatedUser)

          // Update localStorage with latest user data
          localStorage.setItem("user", JSON.stringify(updatedUser))
        } else {
          // User not found in API, but we still have context data - just use that
          console.warn("User not found in GetUser API, using context data")
        }
      } catch (error) {
        // API error, but we still have context data - just log it
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [contextUser, router, toast])

  const handleCopyReferralCode = async () => {
    if (user?.ReferralCode) {
      try {
        await navigator.clipboard.writeText(user.ReferralCode)
        setCopiedCode(true)
        toast({
          title: "Copied!",
          description: "Referral code copied to clipboard",
        })
        setTimeout(() => setCopiedCode(false), 2000)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy referral code",
          variant: "destructive",
        })
      }
    }
  }

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    })
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBackToDashboard} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Profile Information</CardTitle>
          <CardDescription>View your personal details and account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <Input id="name" value={user?.Name || ""} readOnly className="bg-muted" />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input id="email" value={user?.Email || ""} readOnly className="bg-muted" />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input id="phone" value={user?.PhoneNumber || ""} readOnly className="bg-muted" />
          </div>

          {/* Referral Code */}
          <div className="space-y-2">
            <Label htmlFor="referralCode" className="flex items-center gap-2 text-muted-foreground">
              <Share2 className="h-4 w-4" />
              Your Referral Code
            </Label>
            <div className="flex gap-2">
              <Input
                id="referralCode"
                value={user?.ReferralCode || ""}
                readOnly
                className="bg-muted font-mono text-lg font-semibold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyReferralCode}
                className="shrink-0"
              >
                {copiedCode ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with friends! Both you and your friend will receive $5 after their first transaction.
            </p>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleLogout}
              className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
