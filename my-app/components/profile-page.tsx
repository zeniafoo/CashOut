"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/lib/api/auth"
import { User, Mail, Phone, Share2, LogOut, Copy, Check, ArrowLeft, QrCode, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateUserQRData, generateQRCodeDataURL } from "@/lib/qr-code"
import type { User as UserType } from "@/types/auth"

export function ProfilePage() {
  const router = useRouter()
  const { user: contextUser, logout } = useAuth()
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(contextUser)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

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
          // User not found in API, but we still have context data - use that
          console.warn("User not found in GetUser API, using context data")
          // Make sure we're using the context user data
          if (contextUser) {
            setUser(contextUser)
          }
        }
      } catch (error) {
        // API error, but we still have context data - use that
        console.error("Error fetching user data:", error)
        // Make sure we're using the context user data
        if (contextUser) {
          setUser(contextUser)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [contextUser, router, toast])

  // Generate QR code when user data is available
  useEffect(() => {
    const generateQR = async () => {
      if (user?.UserId && user?.Name) {
        const qrData = generateUserQRData(user.UserId, user.Name)
        const qrUrl = await generateQRCodeDataURL(qrData)
        setQrCodeUrl(qrUrl)
      }
    }

    generateQR()
  }, [user])

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

  const handleDownloadQR = () => {
    if (qrCodeUrl && user?.Name) {
      // Create a temporary link to download the QR code
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = `${user.Name.replace(/\s+/g, '_')}_QRCode.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been saved",
      })
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

          {/* QR Code for Receiving Payments */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <QrCode className="h-4 w-4" />
              Your Payment QR Code
            </Label>
            <div className="bg-muted/50 p-6 rounded-lg">
              <div className="flex flex-col items-center gap-4">
                {qrCodeUrl ? (
                  <>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <img
                        src={qrCodeUrl}
                        alt="Your Payment QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground max-w-xs">
                      Share this QR code with others to receive payments directly to your account
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadQR}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download QR Code
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 w-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </div>
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
