import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import type { ConsultingStats } from "@/lib/types"

interface CompletedConsultingStatsProps {
  stats: ConsultingStats
  isLoading: boolean
}

export function CompletedConsultingStats({ stats, isLoading }: CompletedConsultingStatsProps) {
  // Verificar se estamos em ambiente de preview
  const isPreview =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") || window.location.hostname === "localhost")

  // Garantir que temos valores válidos para exibir
  const safeStats = {
    completedProjects: stats?.completedProjects || 0,
    totalRevenue: stats?.totalRevenue || 0,
    averageRating: stats?.averageRating || 0,
    deadlineComplianceRate: stats?.deadlineComplianceRate || 0,
  }

  // Função para renderizar o conteúdo de cada card
  const renderCardContent = (value: string | number, isLoading: boolean) => {
    if (isLoading) {
      return <Skeleton className="h-7 w-20" />
    }
    return <div className="text-2xl font-bold">{value}</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de Consultorias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Consultorias</CardTitle>
          {isPreview && <span className="text-xs text-blue-600 font-medium">DEMO</span>}
        </CardHeader>
        <CardContent>
          {renderCardContent(safeStats.completedProjects, isLoading)}
          <p className="text-xs text-muted-foreground">Consultorias concluídas</p>
        </CardContent>
      </Card>

      {/* Receita Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          {isPreview && <span className="text-xs text-blue-600 font-medium">DEMO</span>}
        </CardHeader>
        <CardContent>
          {renderCardContent(formatCurrency(safeStats.totalRevenue), isLoading)}
          <p className="text-xs text-muted-foreground">Valor total das consultorias</p>
        </CardContent>
      </Card>

      {/* Avaliação Média */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
          {isPreview && <span className="text-xs text-blue-600 font-medium">DEMO</span>}
        </CardHeader>
        <CardContent>
          {renderCardContent(`${safeStats.averageRating.toFixed(1)}/5`, isLoading)}
          <p className="text-xs text-muted-foreground">
            Média de avaliações
            {safeStats.averageRating >= 4.5 && " ⭐"}
            {safeStats.averageRating >= 4.0 && safeStats.averageRating < 4.5 && " 👍"}
          </p>
        </CardContent>
      </Card>

      {/* Cumprimento de Prazo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cumprimento de Prazo</CardTitle>
          {isPreview && <span className="text-xs text-blue-600 font-medium">DEMO</span>}
        </CardHeader>
        <CardContent>
          {renderCardContent(`${safeStats.deadlineComplianceRate.toFixed(0)}%`, isLoading)}
          <p className="text-xs text-muted-foreground">
            Taxa de cumprimento de prazos
            {safeStats.deadlineComplianceRate >= 80 && " 🎯"}
            {safeStats.deadlineComplianceRate >= 60 && safeStats.deadlineComplianceRate < 80 && " ⚠️"}
            {safeStats.deadlineComplianceRate < 60 && " 🔴"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
