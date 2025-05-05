import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import type { ConsultingStats } from "@/lib/types"

interface CompletedConsultingStatsProps {
  stats: ConsultingStats
  isLoading: boolean
}

export function CompletedConsultingStats({ stats, isLoading }: CompletedConsultingStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Consultorias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="text-2xl font-bold">{stats.completedProjects}</div>
          )}
          <p className="text-xs text-muted-foreground">Consultorias concluídas</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-28" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          )}
          <p className="text-xs text-muted-foreground">Valor total das consultorias</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
          )}
          <p className="text-xs text-muted-foreground">Média de avaliações</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cumprimento de Prazo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <div className="text-2xl font-bold">{stats.deadlineComplianceRate.toFixed(0)}%</div>
          )}
          <p className="text-xs text-muted-foreground">Taxa de cumprimento de prazos</p>
        </CardContent>
      </Card>
    </div>
  )
}
