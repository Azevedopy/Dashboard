import { getMetrics } from "./data-service"

// Interface para as métricas de suporte calculadas
export interface SupportMetricsCalculated {
  resolutionRate: number
  csatScore: number
  evaluatedPercentage: number
  totalTickets: number
  resolvedTickets: number
  evaluatedTickets: number
}

// Função para buscar e calcular as métricas de suporte
export async function getSupportMetrics(
  startDate?: string,
  endDate?: string,
): Promise<SupportMetricsCalculated | null> {
  try {
    // Buscar métricas do período
    const metrics = await getMetrics(startDate, endDate)

    if (!metrics || metrics.length === 0) {
      return null
    }

    // Calcular totais
    let totalTickets = 0
    let resolvedTickets = 0
    let totalCsatScore = 0
    let evaluatedTickets = 0

    metrics.forEach((metric) => {
      // Para cada métrica, somamos os tickets abertos e resolvidos
      const openTickets = metric.openTickets || metric.open_tickets || 0
      const resolved = metric.resolvedTickets || metric.resolved_tickets || 0

      totalTickets += openTickets + resolved
      resolvedTickets += resolved

      // Para CSAT, usamos o valor já calculado e o multiplicamos pela porcentagem avaliada
      const evaluated = (metric.evaluatedPercentage || metric.evaluated_percentage || 0) / 100
      const csatValue = metric.csatScore || metric.csat_score || 0

      if (evaluated > 0) {
        totalCsatScore += csatValue
        evaluatedTickets += 1
      }
    })

    // Calcular as métricas finais
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0
    const csatScore = evaluatedTickets > 0 ? totalCsatScore / evaluatedTickets : 0
    const evaluatedPercentage = totalTickets > 0 ? (evaluatedTickets / metrics.length) * 100 : 0

    return {
      resolutionRate,
      csatScore,
      evaluatedPercentage,
      totalTickets,
      resolvedTickets,
      evaluatedTickets,
    }
  } catch (error) {
    console.error("Error calculating support metrics:", error)
    return null
  }
}
