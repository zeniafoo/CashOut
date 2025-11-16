import { DashboardHeader } from "@/components/dashboard-header"
import { ExchangeForm } from "@/components/exchange-form"
import { ProtectedRoute } from "@/components/protected-route"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ExchangePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-primary/5">
        <DashboardHeader />
        <main className="container max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
          <div className="mb-4 sm:mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="gap-2 text-sm">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-balance">Currency Exchange</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Exchange between multiple currencies at great rates</p>
          </div>
          <ExchangeForm />
        </main>
      </div>
    </ProtectedRoute>
  )
}
