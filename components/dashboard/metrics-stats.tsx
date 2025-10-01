"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, Clock, Star, BarChart, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function MetricsStats({ metrics, isLoading }) {
  // Verificação se estamos em ambiente de preview
  const isPreview =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel.app"))

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-full max-w-[120px]" />
                <Skeleton className="mt-2 h-4 w-full max-w-[180px]" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  // Se não há métricas E não está em preview, mostrar alerta
  if (!metrics || metrics.length === 0) {
    if (!isPreview) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum dado encontrado</AlertTitle>
          <AlertDescription>
            Não há métricas cadastradas para o período selecionado. Use a página de cadastro de métricas para adicionar
            dados.
          </AlertDescription>
        </Alert>
      )
    }

    // Em preview, mostrar dados de exemplo
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Dados de demonstração</AlertTitle>
        <AlertDescription>
          Você está visualizando dados de exemplo. Em produção, os dados reais serão exibidos aqui.
        </AlertDescription>
      </Alert>
    )
  }

  // Calcular métricas com base nos dados recebidos
  const stats = calculateStats(metrics)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.resolutionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.comparisonResolutionRate > 0
              ? `+${stats.comparisonResolutionRate}% em relação à média`
              : `${stats.comparisonResolutionRate}% em relação à média`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.responseTime} min</div>
          <p className="text-xs text-muted-foreground">
            {stats.comparisonResponseTime < 0
              ? `${stats.comparisonResponseTime}% em relação à média`
              : `+${stats.comparisonResponseTime}% em relação à média`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avaliação (CSAT)</CardTitle>
          <Star className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.csatScore}</div>
          <p className="text-xs text-muted-foreground">
            {stats.comparisonCsatScore > 0
              ? `+${stats.comparisonCsatScore}% em relação à média`
              : `${stats.comparisonCsatScore}% em relação à média`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">% Avaliados</CardTitle>
          <BarChart className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.evaluatedPercentage}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.comparisonEvaluatedPercentage > 0
              ? `+${stats.comparisonEvaluatedPercentage}% em relação à média`
              : `${stats.comparisonEvaluatedPercentage}% em relação à média`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Função para calcular estatísticas a partir das métricas
function calculateStats(metrics) {
  try {
    const totalMetrics = metrics.length

    if (totalMetrics === 0) {
      throw new Error("Sem métricas para calcular")
    }

    let totalResolutionRate = 0
    let totalResponseTime = 0
    let totalCsatScore = 0
    let totalEvaluatedPercentage = 0

    metrics.forEach((metric) => {
      totalResolutionRate += Number(metric.resolution_rate || 0)
      totalResponseTime += Number(metric.average_response_time || 0)
      totalCsatScore += Number(metric.csat_score || 0)
      totalEvaluatedPercentage += Number(metric.evaluated_percentage || 0)
    })

    // Calcular médias
    const avgResolutionRate = totalResolutionRate / totalMetrics
    const avgResponseTime = totalResponseTime / totalMetrics
    const avgCsatScore = totalCsatScore / totalMetrics
    const avgEvaluatedPercentage = totalEvaluatedPercentage / totalMetrics

    // Comparações simuladas (na vida real, seriam comparados com o período anterior)
    const comparisonResolutionRate = Math.round((Math.random() * 10 - 5) * 10) / 10
    const comparisonResponseTime = Math.round((Math.random() * 10 - 5) * 10) / 10
    const comparisonCsatScore = Math.round((Math.random() * 6 - 3) * 10) / 10
    const comparisonEvaluatedPercentage = Math.round((Math.random() * 10 - 5) * 10) / 10

    return {
      resolutionRate: avgResolutionRate.toFixed(1),
      responseTime: avgResponseTime.toFixed(1),
      csatScore: avgCsatScore.toFixed(1),
      evaluatedPercentage: avgEvaluatedPercentage.toFixed(1),
      comparisonResolutionRate,
      comparisonResponseTime,
      comparisonCsatScore,
      comparisonEvaluatedPercentage,
    }
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error)
    // Retornar zeros em caso de erro
    return {
      resolutionRate: 0,
      responseTime: 0,
      csatScore: 0,
      evaluatedPercentage: 0,
      comparisonResolutionRate: 0,
      comparisonResponseTime: 0,
      comparisonCsatScore: 0,
      comparisonEvaluatedPercentage: 0,
    }
  }
}
