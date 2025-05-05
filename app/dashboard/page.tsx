import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard"

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Dashboard de Suporte</h1>
        <p className="text-sm text-muted-foreground">Visão geral das métricas e desempenho</p>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <MetricsDashboard />
      </div>
    </div>
  )
}
