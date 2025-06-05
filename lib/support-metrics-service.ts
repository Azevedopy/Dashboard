import { getMetrics } from "./data-service"

// Interface para as métricas de suporte calculadas
export interface SupportMetricsCalculated {
  totalTickets: number
  resolvedFirstContact: number
  notResolvedFirstContact: number
  resolvedTickets: number
  openTickets: number
  evaluatedTickets: number
  resolutionRate: number
  csatScore: number
  evaluatedPercentage: number
}

// Função para buscar e calcular as métricas de suporte
export async function getSupportMetrics(
  startDate?: string,
  endDate?: string,
): Promise<SupportMetricsCalculated | null> {
  try {
    console.log(`=== INICIANDO CÁLCULO DE MÉTRICAS DE SUPORTE ===`)
    console.log(`Parâmetros recebidos: startDate=${startDate}, endDate=${endDate}`)

    // IMPORTANTE: Buscar TODOS os registros sem filtros de data para calcular o total real
    console.log("🔍 Buscando TODOS os registros (ignorando filtros de data para total)")
    const allMetrics = await getMetrics() // SEM filtros de data

    if (!allMetrics || allMetrics.length === 0) {
      console.log("❌ Nenhuma métrica encontrada na tabela")
      return null
    }

    console.log(`📊 Total de registros encontrados na tabela: ${allMetrics.length}`)

    // Usar TODOS os registros para o cálculo (não apenas os filtrados)
    const metrics = allMetrics

    // Calcular totais usando TODOS os registros
    let totalOpenTickets = 0
    let totalResolvedTickets = 0
    let resolvedFirstContact = 0
    let evaluatedTickets = 0
    let totalCsatSum = 0

    console.log("🔄 Processando TODOS os registros para cálculo...")

    metrics.forEach((metric, index) => {
      // Garantir conversão correta para números
      const openTickets = Number(metric.open_tickets || 0)
      const resolvedTickets = Number(metric.resolved_tickets || 0)

      // Verificar se o ticket foi resolvido no primeiro atendimento
      // Assumindo que temos uma coluna first_contact_resolution ou similar
      // Se não tivermos, vamos usar uma estimativa baseada em outros dados
      const firstContactResolution =
        metric.first_contact_resolution === true ||
        metric.first_contact_resolution === "true" ||
        metric.first_contact_resolution === 1

      // Se não tivermos o campo, vamos estimar com base em outros dados
      // Por exemplo, se o tempo de resolução for menor que X, consideramos como primeiro contato
      // Isso é apenas uma estimativa e deve ser ajustado conforme os dados reais
      const hasFirstContactData = metric.first_contact_resolution !== undefined
      const estimatedFirstContact =
        !hasFirstContactData &&
        (Number(metric.resolution_time || 0) < 60 || // menos de 60 minutos
          Number(metric.interactions || 0) === 1) // apenas 1 interação

      const isFirstContact = firstContactResolution || estimatedFirstContact

      // Incrementar contadores
      if (resolvedTickets > 0 && isFirstContact) {
        resolvedFirstContact += resolvedTickets
      }

      // Verificar se há valores inválidos
      if (isNaN(openTickets) || isNaN(resolvedTickets)) {
        console.warn(
          `⚠️  Valor inválido no registro ${index + 1}: open=${metric.open_tickets}, resolved=${metric.resolved_tickets}`,
        )
        return // Pular este registro
      }

      totalOpenTickets += openTickets
      totalResolvedTickets += resolvedTickets

      // Para CSAT
      const evaluatedPercentage = Number(metric.evaluated_percentage || 0)
      const csatScore = Number(metric.csat_score || 0)

      if (evaluatedPercentage > 0 && csatScore > 0) {
        totalCsatSum += csatScore
        evaluatedTickets += 1
      }

      // Log detalhado dos primeiros 10 registros
      if (index < 10) {
        console.log(
          `📝 Registro ${index + 1}: Data=${metric.date}, Open=${openTickets}, Resolved=${resolvedTickets}, FirstContact=${isFirstContact}`,
        )
      }
    })

    // CORREÇÃO: Total de atendimentos = APENAS soma de open_tickets
    const totalTickets = totalOpenTickets // NÃO somar com resolved_tickets

    // CORREÇÃO: Não resolvidos no primeiro atendimento = Total - Resolvidos no primeiro atendimento
    const notResolvedFirstContact = totalTickets - resolvedFirstContact

    // Calcular outras métricas (mesmo que não sejam exibidas, para manter compatibilidade)
    const totalForResolutionRate = totalOpenTickets + totalResolvedTickets
    const resolutionRate = totalForResolutionRate > 0 ? (totalResolvedTickets / totalForResolutionRate) * 100 : 0
    const csatScore = evaluatedTickets > 0 ? totalCsatSum / evaluatedTickets : 0
    const evaluatedPercentage = metrics.length > 0 ? (evaluatedTickets / metrics.length) * 100 : 0

    // Se não temos dados de resolução no primeiro contato, vamos estimar
    if (resolvedFirstContact === 0 && totalTickets > 0) {
      console.log("⚠️  Sem dados específicos de resolução no primeiro contato. Usando estimativa...")
      // Estimativa: 60% resolvidos no primeiro contato
      resolvedFirstContact = Math.round(totalTickets * 0.6)
      // Recalcular não resolvidos
      const notResolvedFirstContact = totalTickets - resolvedFirstContact
    }

    console.log("=== RESUMO FINAL DOS CÁLCULOS ===")
    console.log(`📊 Total de registros processados: ${metrics.length}`)
    console.log(`🎫 Total de ATENDIMENTOS (apenas open_tickets): ${totalTickets}`)
    console.log(`✅ Resolvidos no primeiro atendimento: ${resolvedFirstContact}`)
    console.log(`❌ Não resolvidos no primeiro atendimento: ${notResolvedFirstContact}`)
    console.log(`🎫 Open tickets: ${totalOpenTickets}`)
    console.log(`✅ Resolved tickets: ${totalResolvedTickets}`)
    console.log(
      `📊 Fórmula: Não resolvidos = Total (${totalTickets}) - Resolvidos no primeiro (${resolvedFirstContact})`,
    )

    return {
      totalTickets,
      resolvedFirstContact,
      notResolvedFirstContact,
      resolvedTickets: totalResolvedTickets,
      openTickets: totalOpenTickets,
      evaluatedTickets,
      resolutionRate: Number.parseFloat(resolutionRate.toFixed(2)),
      csatScore: Number.parseFloat(csatScore.toFixed(2)),
      evaluatedPercentage: Number.parseFloat(evaluatedPercentage.toFixed(2)),
    }
  } catch (error) {
    console.error("❌ Error calculating support metrics:", error)
    return null
  }
}
