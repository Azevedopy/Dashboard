import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, Clock, Star, CheckCircle, BarChart2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function GenierStats({ stats, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="text-sm text-muted-foreground">
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-7 w-36" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nenhum dado disponível</CardTitle>
            <div className="text-sm text-muted-foreground">Não foi possível carregar as estatísticas</div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Total de Projetos</div>
          <CardTitle className="text-2xl">{stats.totalProjects}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <BarChart2 className="mr-2 h-4 w-4" />
            <span className="text-sm">
              {stats.activeProjects} ativos, {stats.completedProjects} concluídos
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Receita Total</div>
          <CardTitle className="text-2xl">{formatCurrency(stats.totalRevenue)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4" />
            <span className="text-sm">Valor total dos projetos</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Duração Média</div>
          <CardTitle className="text-2xl">{stats.averageProjectDuration.toFixed(0)} dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span className="text-sm">Tempo médio por projeto</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Avaliação Média</div>
          <CardTitle className="text-2xl">{stats.averageRating.toFixed(1)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Star className="mr-2 h-4 w-4" />
            <span className="text-sm">Escala de 1 a 5</span>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Taxa de Cumprimento de Prazo</div>
          <CardTitle className="text-2xl">{stats.deadlineComplianceRate.toFixed(1)}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <CheckCircle className="mr-2 h-4 w-4" />
            <span className="text-sm">Projetos entregues dentro do prazo</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
