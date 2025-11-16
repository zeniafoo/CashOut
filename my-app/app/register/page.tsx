import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/30 via-background to-primary/10 p-3 sm:p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-2">CashOut</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Your smart money companion</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
