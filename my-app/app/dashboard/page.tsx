import { DashboardHeader } from "@/components/dashboard-header"
import { BalanceCard } from "@/components/balance-card"
import { QuickActions } from "@/components/quick-actions"
import { RecentTransactions } from "@/components/recent-transactions"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-primary/5">
      <DashboardHeader />
      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <BalanceCard />
        <QuickActions />
        <RecentTransactions />
      </main>
    </div>
  )
}
