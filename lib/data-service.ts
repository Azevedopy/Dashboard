import { getSupabase } from "./supabase"
import type { Member, MetricEntry, DailyMetric, MemberMetrics } from "./types"
import { format, parseISO, addDays } from "date-fns"

// Função auxiliar para converter snake_case para camelCase
function snakeToCamel(metrics: MetricEntry[]): MetricEntry[] {
  return metrics.map((metric) => ({
    ...metric,
    // Adicionamos propriedades camelCase mantendo as snake_case existentes
    resolutionRate: metric.resolution_rate,
    averageResponseTime: metric.average_response_time,
    csatScore: metric.csat_score,
    evaluatedPercentage: metric.evaluated_percentage,
    openTickets: metric.open_tickets,
    resolvedTickets: metric.resolved_tickets,
  }))
}

// Função para formatar números com 2 casas decimais
function formatDecimal(value: number): number {
  return Number.parseFloat(value.toFixed(2))
}

// Members
export async function getMembers(): Promise<Member[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("members").select("*").order("name")

    if (error) {
      console.error("Error fetching members:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching members:", error)
    return []
  }
}

export async function getMemberById(id: string): Promise<Member | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("members").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching member:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching member:", error)
    return null
  }
}

export async function createMember(member: Omit<Member, "id" | "joined_at" | "created_at">): Promise<Member | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("members").insert([member]).select().single()

    if (error) {
      console.error("Error creating member:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error creating member:", error)
    return null
  }
}

// Metrics
// Adicionar logs específicos na função getMetrics

export async function getMetrics(startDate?: string, endDate?: string): Promise<MetricEntry[]> {
  try {
    const supabase = getSupabase()
    console.log(`Buscando métricas de ${startDate || "início"} até ${endDate || "hoje"}`)

    // Primeiro, buscar as métricas
    let query = supabase.from("metrics").select("*").order("date", { ascending: false })

    if (startDate) {
      // Usar a data exatamente como está, sem ajustes de fuso horário
      query = query.gte("date", startDate)
      console.log(`Filtrando métricas a partir de ${startDate}`)
    }

    if (endDate) {
      // Adicionar um dia ao endDate para incluir o próprio dia na consulta
      const nextDay = addDays(parseISO(endDate), 1)
      const adjustedEndDate = format(nextDay, "yyyy-MM-dd")

      query = query.lt("date", adjustedEndDate)
      console.log(`Filtrando métricas até ${endDate} (ajustado para ${adjustedEndDate})`)
    }

    const { data: metricsData, error: metricsError } = await query

    if (metricsError) {
      console.error("Error fetching metrics:", metricsError)
      return []
    }

    // Se não temos métricas, retornar array vazio
    if (!metricsData || metricsData.length === 0) {
      console.log("Nenhuma métrica encontrada para o período especificado")
      return []
    }

    console.log(`Encontradas ${metricsData.length} métricas. Datas:`, metricsData.map((m) => m.date).sort())

    // Log para verificar os dados brutos do Emerson
    const emersonMetrics = metricsData.filter((m) => {
      // Verificar se o member_id corresponde ao Emerson
      // Isso depende de como os IDs estão estruturados no seu banco
      return m.member_id && (m.member_id.includes("Emerson") || m.member_id === "emerson-id")
    })

    if (emersonMetrics.length > 0) {
      console.log("Dados brutos do Emerson do Supabase:", emersonMetrics)
    }

    // Buscar todos os membros para mapear IDs para nomes
    const { data: membersData, error: membersError } = await supabase.from("members").select("id, name")

    if (membersError) {
      console.error("Error fetching members:", membersError)
      // Retornar métricas sem nomes de membros
      return snakeToCamel(metricsData)
    }

    // Criar um mapa de ID para nome
    const memberMap = new Map()
    membersData?.forEach((member) => {
      memberMap.set(member.id, member.name)
    })

    // Adicionar nomes de membros às métricas sem modificar os valores numéricos
    const processedData = metricsData.map((metric) => {
      const memberName = memberMap.get(metric.member_id) || "Desconhecido"

      // IMPORTANTE: Não modificar os valores numéricos aqui
      // Manter os valores exatamente como vieram do banco de dados

      // Log para verificar os dados do Emerson
      if (memberName === "Emerson") {
        console.log(`Métrica do Emerson - Data: ${metric.date}, Tempo médio: ${metric.average_response_time}`)
      }

      return {
        ...metric,
        member: memberName,
        // Manter a data exatamente como está no banco
        date: metric.date,
        // Manter os valores numéricos exatamente como estão
        average_response_time: metric.average_response_time,
        resolution_rate: metric.resolution_rate,
        csat_score: metric.csat_score,
        evaluated_percentage: metric.evaluated_percentage,
      }
    })

    // Adicionar propriedades em camelCase para compatibilidade
    const result = snakeToCamel(processedData)

    // Log para verificar os dados finais do Emerson
    const finalEmersonData = result.filter((m) => m.member === "Emerson")
    if (finalEmersonData.length > 0) {
      console.log("Dados finais do Emerson após processamento:", finalEmersonData)
    }

    return result
  } catch (error) {
    console.error("Unexpected error fetching metrics:", error)
    return []
  }
}

// Buscar métricas específicas do Genier
export async function getGenierMetrics(startDate?: string, endDate?: string): Promise<MetricEntry[]> {
  try {
    const supabase = getSupabase()

    // Primeiro, buscar os IDs dos membros Genier
    const { data: members, error: membersError } = await supabase.from("members").select("id").ilike("name", "%genier%")

    if (membersError) {
      console.error("Error fetching Genier members:", membersError)
      return []
    }

    // Se não encontramos membros Genier, retornar array vazio
    if (!members || members.length === 0) {
      return []
    }

    const genierIds = members.map((m) => m.id)

    // Agora buscar as métricas desses membros
    let query = supabase.from("metrics").select("*").in("member_id", genierIds).order("date", { ascending: false })

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      // Adicionar um dia ao endDate para incluir o próprio dia na consulta
      const nextDay = addDays(parseISO(endDate), 1)
      const adjustedEndDate = format(nextDay, "yyyy-MM-dd")
      query = query.lt("date", adjustedEndDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching Genier metrics:", error)
      return []
    }

    // Buscar nomes dos membros
    const { data: membersData } = await supabase.from("members").select("id, name").in("id", genierIds)

    // Criar um mapa de ID para nome
    const memberMap = new Map()
    membersData?.forEach((member) => {
      memberMap.set(member.id, member.name)
    })

    // Processar os dados para incluir o nome do membro
    const processedData =
      data?.map((item) => ({
        ...item,
        member: memberMap.get(item.member_id) || "Genier",
      })) || []

    // Adicionar propriedades em camelCase para compatibilidade
    return snakeToCamel(processedData)
  } catch (error) {
    console.error("Unexpected error fetching Genier metrics:", error)
    return []
  }
}

export async function getMemberMetrics(memberId: string, startDate?: string, endDate?: string): Promise<MetricEntry[]> {
  try {
    const supabase = getSupabase()
    let query = supabase.from("metrics").select("*").eq("member_id", memberId).order("date", { ascending: false })

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      // Adicionar um dia ao endDate para incluir o próprio dia na consulta
      const nextDay = addDays(parseISO(endDate), 1)
      const adjustedEndDate = format(nextDay, "yyyy-MM-dd")
      query = query.lt("date", adjustedEndDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching member metrics:", error)
      return []
    }

    // Adicionar propriedades em camelCase para compatibilidade
    return snakeToCamel(data || [])
  } catch (error) {
    console.error("Unexpected error fetching member metrics:", error)
    return []
  }
}

// Função para criar métricas
export async function createMetric(metricData: any): Promise<MetricEntry | null> {
  try {
    const supabase = getSupabase()

    // Usar a data exatamente como está, sem ajustes de fuso horário
    const date = metricData.date
    console.log(`Data a ser salva no banco: ${date}`)

    // Formatar valores decimais para ter no máximo 2 casas decimais
    const resolution_rate = formatDecimal(metricData.resolution_rate || 0)
    const average_response_time = formatDecimal(metricData.average_response_time || 0)
    const csat_score = formatDecimal(metricData.csat_score || 0)
    const evaluated_percentage = formatDecimal(metricData.evaluated_percentage || 0)

    // Usar snake_case para os nomes das colunas (formato do banco)
    const data = {
      member_id: metricData.member_id,
      date: date,
      resolution_rate: resolution_rate,
      average_response_time: average_response_time,
      csat_score: csat_score,
      evaluated_percentage: evaluated_percentage,
      open_tickets: metricData.open_tickets,
      resolved_tickets: metricData.resolved_tickets,
    }

    console.log("Dados formatados para inserção:", data)

    const { data: result, error } = await supabase.from("metrics").insert([data]).select().single()

    if (error) {
      console.error("Error creating metric:", error)
      return null
    }

    console.log("Métrica salva com sucesso:", result)

    // Adicionar propriedades em camelCase para compatibilidade
    return {
      ...result,
      resolutionRate: result.resolution_rate,
      averageResponseTime: result.average_response_time,
      csatScore: result.csat_score,
      evaluatedPercentage: result.evaluated_percentage,
      openTickets: result.open_tickets,
      resolvedTickets: result.resolved_tickets,
    }
  } catch (error) {
    console.error("Unexpected error creating metric:", error)
    return null
  }
}

// Aggregated metrics
export async function getAggregatedMetrics(startDate?: string, endDate?: string): Promise<DailyMetric[]> {
  try {
    // First get all metrics for the date range
    const metrics = await getMetrics(startDate, endDate)

    // Then get all members to calculate averages
    const members = await getMembers()
    const memberCount = members.length || 1 // Avoid division by zero

    // Group metrics by date
    const dailyMetrics: Record<string, DailyMetric> = {}

    metrics.forEach((metric) => {
      if (!dailyMetrics[metric.date]) {
        dailyMetrics[metric.date] = {
          date: metric.date,
          resolution_rate: 0,
          average_response_time: 0,
          csat_score: 0,
          evaluated_percentage: 0,
          open_tickets: 0,
          resolved_tickets: 0,
        }
      }

      dailyMetrics[metric.date].resolution_rate += metric.resolution_rate
      dailyMetrics[metric.date].average_response_time += metric.average_response_time
      dailyMetrics[metric.date].csat_score += metric.csat_score
      dailyMetrics[metric.date].evaluated_percentage += metric.evaluated_percentage
      dailyMetrics[metric.date].open_tickets += metric.open_tickets
      dailyMetrics[metric.date].resolved_tickets += metric.resolved_tickets
    })

    // Calculate averages and format to 2 decimal places
    Object.keys(dailyMetrics).forEach((date) => {
      dailyMetrics[date].resolution_rate = formatDecimal(dailyMetrics[date].resolution_rate / memberCount)
      dailyMetrics[date].average_response_time = formatDecimal(dailyMetrics[date].average_response_time / memberCount)
      dailyMetrics[date].csat_score = formatDecimal(dailyMetrics[date].csat_score / memberCount)
      dailyMetrics[date].evaluated_percentage = formatDecimal(dailyMetrics[date].evaluated_percentage / memberCount)
    })

    return Object.values(dailyMetrics).sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error("Unexpected error getting aggregated metrics:", error)
    return []
  }
}

export async function getTopPerformers(): Promise<MemberMetrics[]> {
  try {
    // Get all members
    const members = await getMembers()

    // Get metrics for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = format(thirtyDaysAgo, "yyyy-MM-dd")

    const metrics = await getMetrics(startDate)

    // Group metrics by member
    const memberMetrics: Record<string, MemberMetrics> = {}

    members.forEach((member) => {
      memberMetrics[member.id] = {
        member,
        metrics: [],
      }
    })

    metrics.forEach((metric) => {
      if (memberMetrics[metric.member_id]) {
        memberMetrics[metric.member_id].metrics.push(metric)
      }
    })

    // Sort by average CSAT score
    return Object.values(memberMetrics)
      .filter((item) => item.metrics.length > 0)
      .sort((a, b) => {
        const aAvgCsat = a.metrics.reduce((sum, m) => sum + m.csat_score, 0) / a.metrics.length
        const bAvgCsat = b.metrics.reduce((sum, m) => sum + m.csat_score, 0) / b.metrics.length
        return bAvgCsat - aAvgCsat
      })
  } catch (error) {
    console.error("Unexpected error getting top performers:", error)
    return []
  }
}

// Upload data from CSV
export async function uploadMetricsFromCSV(csvData: any[]): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = getSupabase()
    if (!csvData.length) {
      return { success: false, message: "Nenhum dado para importar" }
    }

    const formattedData = csvData.map((row) => ({
      member_id: row.member_id,
      date: row.date, // Manter a data original do CSV
      resolution_rate: formatDecimal(Number.parseFloat(row.resolution_rate || "0")),
      average_response_time: formatDecimal(Number.parseFloat(row.average_response_time || "0")),
      csat_score: formatDecimal(Number.parseFloat(row.csat_score || "0")),
      evaluated_percentage: formatDecimal(Number.parseFloat(row.evaluated_percentage || "0")),
      open_tickets: Number.parseInt(row.open_tickets || "0", 10),
      resolved_tickets: Number.parseInt(row.resolved_tickets || "0", 10),
    }))

    const { error } = await supabase.from("metrics").insert(formattedData)

    if (error) throw error

    return { success: true, message: `${formattedData.length} registros importados com sucesso` }
  } catch (error) {
    console.error("Error uploading metrics:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido ao importar dados",
    }
  }
}
