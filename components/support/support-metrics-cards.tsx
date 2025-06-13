import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, Clock, Star } from "lucide-react"

interface SupportMetricsCardsProps {
  metrics: any
  isLoading: boolean
}

export function SupportMetricsCards({ metrics, isLoading }: SupportMetricsCardsProps) {
  // Verificação para ambiente de preview - sempre mostra dados de exemplo
  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.dev")

  // Dados de exemplo para preview
  const mockMetrics = {
    resolutionRate: 92.5,
    csatScore: 4.6,
    evaluatedPercentage: 78.3,
    resolvedTickets: 185,
    openTickets: 200,
    evaluatedTickets: 156,
    totalTickets: 200,
  }

  // Se estamos em preview ou metrics é nulo, use os dados mockados
  const displayMetrics = isPreview || !metrics ? mockMetrics : metrics

  // Função para determinar a cor com base no valor
  const getColorClass = (value: number, thresholds: { good: number; medium: number }) => {
    if (value >= thresholds.good) return "text-green-500"
    if (value >= thresholds.medium) return "text-amber-500"
    return "text-red-500"
  }

  // Valores para exibição
  const resolutionRate = displayMetrics?.resolutionRate?.toFixed(1) || 0
  const csatScore = displayMetrics?.csatScore?.toFixed(1) || 0
  const evaluatedPercentage = displayMetrics?.evaluatedPercentage?.toFixed(1) || 0

  // Classes de cores para cada métrica
  const resolutionRateColor = getColorClass(Number(resolutionRate), { good: 90, medium: 70 })
  const csatScoreColor = getColorClass(Number(csatScore), { good: 4, medium: 3 })
  const evaluatedPercentageColor = getColorClass(Number(evaluatedPercentage), { good: 80, medium: 50 })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card de Taxa de Resolução */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Taxa de Resolução no Primeiro Atendimento
                </span>
              </div>
              <div className={`text-3xl font-bold ${resolutionRateColor}`}>{resolutionRate}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                {displayMetrics?.resolvedTickets || 0} resolvidos de {displayMetrics?.openTickets || 0} atendimentos
                abertos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Média de Avaliação (CSAT) */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Média de Avaliação (CSAT)</span>
              </div>
              <div className={`text-3xl font-bold ${csatScoreColor}`}>{csatScore}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Escala de 1 a 5 ({displayMetrics?.evaluatedTickets || 0} avaliações)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de % de Atendimentos Avaliados */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">% de Atendimentos Avaliados</span>
              </div>
              <div className={`text-3xl font-bold ${evaluatedPercentageColor}`}>{evaluatedPercentage}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                {displayMetrics?.evaluatedTickets || 0} de {displayMetrics?.totalTickets || 0} atendimentos avaliados
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
