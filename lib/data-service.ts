import { getSupabase } from "./supabase"
import type { Member, MetricEntry, DailyMetric, MemberMetrics } from "./types"
import { format } from "date-fns"

// Função auxiliar para detectar ambiente de preview
function isPreviewEnvironment(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel.app"))
  )
}

// Função auxiliar para converter snake_case para camelCase
function snakeToCamel(metrics: MetricEntry[]): MetricEntry[] {
  return metrics.map((metric) => ({
    ...metric,
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

// Função para gerar dados mockados realistas (APENAS para preview)
function generateMockMetrics(days = 30) {
  const mockMembers = [
    { id: "1", name: "Ana Silva", service_type: "suporte" },
    { id: "2", name: "Carlos Santos", service_type: "suporte" },
    { id: "3", name: "Maria Oliveira", service_type: "suporte" },
    { id: "4", name: "João Costa", service_type: "suporte" },
  ]

  const metrics = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split("T")[0]

    for (const member of mockMembers) {
      const resolutionRate = Math.floor(Math.random() * 30) + 70
      const avgResponseTime = Math.floor(Math.random() * 120) + 30
      const csatScore = (Math.random() * 1.5 + 3.5).toFixed(1)
      const evaluatedPercentage = Math.floor(Math.random() * 40) + 60
      const openTickets = Math.floor(Math.random() * 15) + 5
      const resolvedTickets = Math.floor(Math.random() * 25) + 10

      metrics.push({
        id: `mock-${member.id}-${i}`,
        member_id: member.id,
        member: member.name,
        date: dateString,
        resolution_rate: resolutionRate,
        average_response_time: avgResponseTime,
        csat_score: Number.parseFloat(csatScore),
        evaluated_percentage: evaluatedPercentage,
        open_tickets: openTickets,
        resolved_tickets: resolvedTickets,
        service_type: member.service_type,
        resolutionRate,
        averageResponseTime: avgResponseTime,
        csatScore: Number.parseFloat(csatScore),
        evaluatedPercentage,
        openTickets,
        resolvedTickets,
        serviceType: member.service_type,
      })
    }
  }

  return metrics
}

// Members
export async function getMembers(): Promise<Member[]> {
  try {
    // Verificar se estamos em ambiente de preview
    if (isPreviewEnvironment()) {
      console.log("👥 Ambiente de preview - usando membros mockados")
      return [
        {
          id: "1",
          name: "Ana Silva",
          email: "ana@empresa.com",
          service_type: "suporte",
          role: "Atendente",
          joined_at: "2024-01-01",
          created_at: "2024-01-01",
          access_type: "member",
        },
        {
          id: "2",
          name: "Carlos Santos",
          email: "carlos@empresa.com",
          service_type: "suporte",
          role: "Atendente",
          joined_at: "2024-01-01",
          created_at: "2024-01-01",
          access_type: "member",
        },
        {
          id: "3",
          name: "Maria Oliveira",
          email: "maria@empresa.com",
          service_type: "suporte",
          role: "Atendente",
          joined_at: "2024-01-01",
          created_at: "2024-01-01",
          access_type: "member",
        },
        {
          id: "4",
          name: "João Costa",
          email: "joao@empresa.com",
          service_type: "suporte",
          role: "Atendente",
          joined_at: "2024-01-01",
          created_at: "2024-01-01",
          access_type: "member",
        },
      ]
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error("❌ Cliente Supabase não disponível")
      return []
    }

    const { data, error } = await supabase.from("members").select("*").order("name")

    if (error) {
      console.error("❌ Erro ao buscar membros:", error)
      return []
    }

    console.log(`✅ ${data?.length || 0} membros encontrados no banco`)
    return data || []
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar membros:", error)
    return []
  }
}

export async function getMemberById(id: string): Promise<Member | null> {
  try {
    if (isPreviewEnvironment()) {
      const mockMembers = await getMembers()
      return mockMembers.find((m) => m.id === id) || null
    }

    const supabase = getSupabase()
    if (!supabase) {
      return null
    }

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
    if (isPreviewEnvironment()) {
      console.log("👥 Simulando criação de membro em ambiente de preview")
      return {
        ...member,
        id: `mock-${Date.now()}`,
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      } as Member
    }

    const supabase = getSupabase()
    if (!supabase) {
      return null
    }

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
export async function getMetrics(startDate?: string, endDate?: string, serviceType?: string): Promise<MetricEntry[]> {
  try {
    console.log(`=== INICIANDO BUSCA DE MÉTRICAS ===`)
    console.log(
      `Parâmetros: startDate=${startDate || "TODOS"}, endDate=${endDate || "TODOS"}, serviceType=${serviceType || "TODOS"}`,
    )

    // APENAS usar dados mockados em ambiente de preview
    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - retornando dados mockados")
      await new Promise((resolve) => setTimeout(resolve, 500))
      return generateMockMetrics(30)
    }

    const supabase = getSupabase()

    if (!supabase) {
      console.error("❌ Cliente Supabase não disponível")
      return []
    }

    let query = supabase.from("metrics").select("*")

    if (startDate) {
      query = query.gte("date", startDate)
      console.log(`✅ Aplicando filtro: date >= ${startDate}`)
    }

    if (endDate) {
      query = query.lte("date", endDate)
      console.log(`✅ Aplicando filtro: date <= ${endDate}`)
    }

    if (serviceType) {
      query = query.eq("service_type", serviceType)
      console.log(`✅ Aplicando filtro: service_type = ${serviceType}`)
    }

    query = query.order("date", { ascending: false })

    console.log("🔄 Executando consulta no Supabase...")

    const { data: metricsData, error: metricsError } = await query

    if (metricsError) {
      console.error("❌ Erro ao buscar métricas:", metricsError)
      return []
    }

    if (!metricsData || metricsData.length === 0) {
      console.log("⚠️ Nenhuma métrica encontrada no banco de dados")
      return []
    }

    console.log(`✅ ${metricsData.length} métricas encontradas no banco`)

    // Buscar nomes dos membros
    const { data: membersData } = await supabase.from("members").select("id, name")

    const memberMap = new Map()
    membersData?.forEach((member) => {
      memberMap.set(member.id, member.name)
    })

    const processedData = metricsData.map((metric) => {
      const memberName = memberMap.get(metric.member_id) || "Desconhecido"

      return {
        ...metric,
        member: memberName,
        open_tickets: Number(metric.open_tickets || 0),
        resolved_tickets: Number(metric.resolved_tickets || 0),
        average_response_time: Number(metric.average_response_time || 0),
        resolution_rate: Number(metric.resolution_rate || 0),
        csat_score: Number(metric.csat_score || 0),
        evaluated_percentage: Number(metric.evaluated_percentage || 0),
      }
    })

    const result = snakeToCamel(processedData)

    console.log(`✅ Retornando ${result.length} registros processados`)
    return result
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar métricas:", error)
    return []
  }
}

export async function getGenierMetrics(startDate?: string, endDate?: string): Promise<MetricEntry[]> {
  try {
    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - retornando dados mockados para Genier")
      return generateMockMetrics(30).filter((m) => m.member.includes("Silva"))
    }

    const supabase = getSupabase()
    if (!supabase) {
      return []
    }

    const { data: members, error: membersError } = await supabase.from("members").select("id").ilike("name", "%genier%")

    if (membersError || !members || members.length === 0) {
      return []
    }

    const genierIds = members.map((m) => m.id)

    let query = supabase.from("metrics").select("*").in("member_id", genierIds).order("date", { ascending: false })

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching Genier metrics:", error)
      return []
    }

    const { data: membersData } = await supabase.from("members").select("id, name").in("id", genierIds)

    const memberMap = new Map()
    membersData?.forEach((member) => {
      memberMap.set(member.id, member.name)
    })

    const processedData =
      data?.map((item) => ({
        ...item,
        member: memberMap.get(item.member_id) || "Genier",
      })) || []

    return snakeToCamel(processedData)
  } catch (error) {
    console.error("Unexpected error fetching Genier metrics:", error)
    return []
  }
}

export async function getMemberMetrics(memberId: string, startDate?: string, endDate?: string): Promise<MetricEntry[]> {
  try {
    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - retornando dados mockados para membro")
      return generateMockMetrics(30).filter((m) => m.member_id === memberId)
    }

    const supabase = getSupabase()
    if (!supabase) {
      return []
    }

    let query = supabase.from("metrics").select("*").eq("member_id", memberId).order("date", { ascending: false })

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching member metrics:", error)
      return []
    }

    return snakeToCamel(data || [])
  } catch (error) {
    console.error("Unexpected error fetching member metrics:", error)
    return []
  }
}

export async function createMetric(metricData: any): Promise<MetricEntry | null> {
  try {
    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - simulando criação de métrica")
      return {
        ...metricData,
        id: "mock-id-" + Date.now(),
        created_at: new Date().toISOString(),
      }
    }

    const supabase = getSupabase()
    if (!supabase) {
      return null
    }

    const date = metricData.date
    console.log(`Data a ser salva no banco: ${date}`)

    const resolution_rate = formatDecimal(metricData.resolution_rate || 0)
    const average_response_time = formatDecimal(metricData.average_response_time || 0)
    const csat_score = formatDecimal(metricData.csat_score || 0)
    const evaluated_percentage = formatDecimal(metricData.evaluated_percentage || 0)

    const data = {
      member_id: metricData.member_id,
      date: date,
      resolution_rate: resolution_rate,
      average_response_time: average_response_time,
      csat_score: csat_score,
      evaluated_percentage: evaluated_percentage,
      open_tickets: metricData.open_tickets,
      resolved_tickets: metricData.resolved_tickets,
      service_type: metricData.service_type,
    }

    console.log("Dados formatados para inserção:", data)

    const { data: result, error } = await supabase.from("metrics").insert([data]).select().single()

    if (error) {
      console.error("Error creating metric:", error)
      return null
    }

    console.log("Métrica salva com sucesso:", result)

    return {
      ...result,
      resolutionRate: result.resolution_rate,
      averageResponseTime: result.average_response_time,
      csatScore: result.csat_score,
      evaluatedPercentage: result.evaluated_percentage,
      openTickets: result.open_tickets,
      resolvedTickets: result.resolved_tickets,
      serviceType: result.service_type,
    }
  } catch (error) {
    console.error("Unexpected error creating metric:", error)
    return null
  }
}

export async function updateMetric(id: string, metricData: any): Promise<MetricEntry | null> {
  try {
    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - simulando atualização de métrica")
      return {
        ...metricData,
        id: id,
        updated_at: new Date().toISOString(),
      }
    }

    const supabase = getSupabase()
    if (!supabase) {
      return null
    }

    const resolution_rate = formatDecimal(metricData.resolution_rate || 0)
    const average_response_time = formatDecimal(metricData.average_response_time || 0)
    const csat_score = formatDecimal(metricData.csat_score || 0)
    const evaluated_percentage = formatDecimal(metricData.evaluated_percentage || 0)

    const data = {
      resolution_rate: resolution_rate,
      average_response_time: average_response_time,
      csat_score: csat_score,
      evaluated_percentage: evaluated_percentage,
      open_tickets: metricData.open_tickets,
      resolved_tickets: metricData.resolved_tickets,
      service_type: metricData.service_type,
    }

    console.log("Dados formatados para atualização:", data)

    const { data: result, error } = await supabase.from("metrics").update(data).eq("id", id).select().single()

    if (error) {
      console.error("Error updating metric:", error)
      return null
    }

    console.log("Métrica atualizada com sucesso:", result)

    return {
      ...result,
      resolutionRate: result.resolution_rate,
      averageResponseTime: result.average_response_time,
      csatScore: result.csat_score,
      evaluatedPercentage: result.evaluated_percentage,
      openTickets: result.open_tickets,
      resolvedTickets: result.resolved_tickets,
      serviceType: result.service_type,
    }
  } catch (error) {
    console.error("Unexpected error updating metric:", error)
    return null
  }
}

export async function deleteMetric(id: string): Promise<boolean> {
  try {
    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - simulando exclusão de métrica")
      return true
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error("❌ Supabase client not initialized")
      return false
    }

    const { error } = await supabase.from("metrics").delete().eq("id", id)

    if (error) {
      console.error("Error deleting metric:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error deleting metric:", error)
    return false
  }
}

export async function getAggregatedMetrics(startDate?: string, endDate?: string): Promise<DailyMetric[]> {
  try {
    const metrics = await getMetrics(startDate, endDate)

    if (metrics.length === 0) {
      return []
    }

    const members = await getMembers()
    const memberCount = members.length || 1

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
    const members = await getMembers()

    if (members.length === 0) {
      return []
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = format(thirtyDaysAgo, "yyyy-MM-dd")

    const metrics = await getMetrics(startDate)

    if (metrics.length === 0) {
      return []
    }

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

export async function uploadMetricsFromCSV(csvData: any[]): Promise<{ success: boolean; message: string }> {
  try {
    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - simulando upload de CSV")
      return { success: true, message: `${csvData.length} registros importados com sucesso (simulado)` }
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error("❌ Supabase client not initialized")
      return { success: false, message: "Cliente Supabase não inicializado" }
    }

    if (!csvData.length) {
      return { success: false, message: "Nenhum dado para importar" }
    }

    const formattedData = csvData.map((row) => ({
      member_id: row.member_id,
      date: row.date,
      resolution_rate: formatDecimal(Number.parseFloat(row.resolution_rate || "0")),
      average_response_time: formatDecimal(Number.parseFloat(row.average_response_time || "0")),
      csat_score: formatDecimal(Number.parseFloat(row.csat_score || "0")),
      evaluated_percentage: formatDecimal(Number.parseFloat(row.evaluated_percentage || "0")),
      open_tickets: Number.parseInt(row.open_tickets || "0", 10),
      resolved_tickets: Number.parseInt(row.resolved_tickets || "0", 10),
      service_type: row.service_type,
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
