import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/30 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-primary mb-2">CashOut</h1>
          <p className="text-muted-foreground">Your smart money companion</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}