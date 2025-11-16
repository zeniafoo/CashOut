"use client"

import { ArrowDownToLine, ArrowRightLeft, Send, ShieldPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      icon: ArrowDownToLine,
      label: "Deposit",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => router.push("/deposit"),
    },
    {
      icon: ArrowRightLeft,
      label: "Exchange",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => router.push("/exchange"),
    },
    {
      icon: Send,
      label: "Transfer",
      color: "text-green-600",
      bgColor: "bg-green-50",
      onClick: () => router.push("/transfer"),
    },
    {
      icon: ShieldPlus,
      label: "Insurance",
      color: "text-green-600",
      bgColor: "bg-green-50",
      onClick: () => router.push("/insurance"),
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Card
          key={action.label}
          className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-2"
          onClick={action.onClick}
        >
          <CardContent className="p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3">
            <div className={`${action.bgColor} p-3 sm:p-4 rounded-2xl`}>
              <action.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${action.color}`} />
            </div>
            <span className="font-semibold text-xs sm:text-sm text-center">{action.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
