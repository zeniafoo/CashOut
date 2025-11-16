'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register } = useAuth()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your name',
        variant: 'destructive',
      })
      return
    }

    if (!email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your email',
        variant: 'destructive',
      })
      return
    }

    if (!phoneNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your phone number',
        variant: 'destructive',
      })
      return
    }

    if (!password) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a password',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await register({
        Name: name,
        Email: email,
        PhoneNumber: phoneNumber,
        Password: password,
      }, referralCode.trim() || undefined) // Pass referral code if provided

      toast({
        title: 'Success',
        description: referralCode.trim()
          ? 'Account created successfully! Referral code applied.'
          : 'Account created successfully!',
      })
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'An error occurred during registration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Create Account</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Sign up to start managing your finances</CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralCode" className="text-sm">
              Referral Code <span className="text-muted-foreground text-[10px] sm:text-xs">(Optional)</span>
            </Label>
            <Input
              id="referralCode"
              type="text"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              disabled={isLoading}
              className="uppercase"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Have a referral code? Both you and your friend get $5 after your first transaction!
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 sm:space-y-4">
          <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
          <Link href="/" className="w-full">
            <Button variant="ghost" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isLoading}>
              <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
