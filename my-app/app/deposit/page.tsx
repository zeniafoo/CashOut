import { DashboardHeader } from "@/components/dashboard-header"
import { DepositForm } from "@/components/deposit-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DepositPage() {
  return (
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
          <h1 className="text-3xl font-bold text-balance">Deposit Money</h1>
          <p className="text-muted-foreground mt-2">Add funds to your cashout account</p>
        </div>
        <DepositForm />
      </main>
    </div>
  )
}
