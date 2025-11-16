import { DashboardHeader } from "@/components/dashboard-header"
import { BalanceCard } from "@/components/balance-card"
import { QuickActions } from "@/components/quick-actions"
import { RecentTransactions } from "@/components/recent-transactions"
import { RecentTransfers } from "@/components/recent-transfers"
import { ProtectedRoute } from "@/components/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-secondary/20 via-background to-primary/5">
        <DashboardHeader />
        <main className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20 sm:pb-6">
          <BalanceCard />
          <QuickActions />
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions" className="text-xs sm:text-sm">Recent Transactions</TabsTrigger>
              <TabsTrigger value="transfers" className="text-xs sm:text-sm">Recent Transfers</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions" className="mt-4">
              <RecentTransactions />
            </TabsContent>
            <TabsContent value="transfers" className="mt-4">
              <RecentTransfers />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}