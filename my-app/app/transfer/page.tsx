import { DashboardHeader } from "@/components/dashboard-header"
import { TransferForm } from "@/components/transfer-form"
import { ProtectedRoute } from "@/components/protected-route"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TransferPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-primary/5">
        <DashboardHeader />
        <main className="container max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-balance">Transfer Money</h1>
            <p className="text-muted-foreground mt-2">Send money instantly to other cashout users</p>
          </div>
          <TransferForm />
        </main>
      </div>
    </ProtectedRoute>
  )
}
