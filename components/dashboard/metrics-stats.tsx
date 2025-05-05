import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, BarChart2, Star, CheckCircle, AlertCircle, CheckCheck } from "lucide-react"

export function MetricsStats({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
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

  if (!metrics || !metrics.length) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nenhum dado disponível</CardTitle>
            <div className="text-sm text-muted-foreground">Selecione outro período ou membro</div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Calcular médias
  const avgResolutionRate = metrics.reduce((sum, metric) => sum + (metric.resolution_rate || 0), 0) / metrics.length
  const avgResponseTime = metrics.reduce((sum, metric) => sum + (metric.average_response_time || 0), 0) / metrics.length
  const avgCsatScore = metrics.reduce((sum, metric) => sum + (metric.csat_score || 0), 0) / metrics.length
  const avgEvaluatedPercentage =
    metrics.reduce((sum, metric) => sum + (metric.evaluated_percentage || 0), 0) / metrics.length
  const totalOpenTickets = metrics.reduce((sum, metric) => sum + (metric.open_tickets || 0), 0)
  const totalResolvedTickets = metrics.reduce((sum, metric) => sum + (metric.resolved_tickets || 0), 0)

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Taxa de Resolução</div>
          <CardTitle className="text-2xl">{avgResolutionRate.toFixed(1)}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <BarChart2 className="mr-2 h-4 w-4" />
            <span className="text-sm">Média do período</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Tempo Médio de Atendimento</div>
          <CardTitle className="text-2xl">{avgResponseTime.toFixed(1)} min</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            <span className="text-sm">Média do período</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">CSAT Médio</div>
          <CardTitle className="text-2xl">{avgCsatScore.toFixed(1)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Star className="mr-2 h-4 w-4" />
            <span className="text-sm">Escala de 1 a 5</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">% de Atendimentos Avaliados</div>
          <CardTitle className="text-2xl">{avgEvaluatedPercentage.toFixed(1)}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <CheckCircle className="mr-2 h-4 w-4" />
            <span className="text-sm">Média do período</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Atendimentos Abertos</div>
          <CardTitle className="text-2xl">{totalOpenTickets}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span className="text-sm">Total do período</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Atendimentos Resolvidos</div>
          <CardTitle className="text-2xl">{totalResolvedTickets}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <CheckCheck className="mr-2 h-4 w-4" />
            <span className="text-sm">Total do período</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
