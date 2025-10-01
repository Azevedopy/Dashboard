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
export async function getMembers(serviceType?: string): Promise<Member[]> {
  try {
    console.log(`🔍 Buscando membros${serviceType ? ` com service_type=${serviceType}` : ""}`)

    // Verificar se estamos em ambiente de preview
    if (isPreviewEnvironment()) {
      console.log("👥 Ambiente de preview - usando membros mockados")
      const mockMembers = [
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
          service_type: "consultoria",
          role: "Consultor",
          joined_at: "2024-01-01",
          created_at: "2024-01-01",
          access_type: "member",
        },
        {
          id: "4",
          name: "João Costa",
          email: "joao@empresa.com",
          service_type: "genier",
          role: "Especialista",
          joined_at: "2024-01-01",
          created_at: "2024-01-01",
          access_type: "member",
        },
      ]
      return serviceType ? mockMembers.filter((m) => m.service_type === serviceType) : mockMembers
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error("❌ Cliente Supabase não disponível")
      return []
    }

    let query = supabase.from("members").select("*")

    if (serviceType) {
      query = query.eq("service_type", serviceType)
    }

    const { data, error } = await query.order("name", { ascending: true })

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
    console.log(`🔍 Buscando membro com id=${id}`)

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
      console.error("❌ Erro ao buscar membro:", error)
      return null
    }

    console.log(`✅ Membro encontrado: ${data?.name}`)
    return data
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar membro:", error)
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
      console.error("❌ Erro ao criar membro:", error)
      return null
    }

    console.log(`✅ Membro criado: ${data?.name}`)
    return data
  } catch (error) {
    console.error("❌ Erro inesperado ao criar membro:", error)
    return null
  }
}

// Metrics
export async function getMetrics(
  startDate?: string,
  endDate?: string,
  memberIds?: string[],
  serviceType?: string,
): Promise<MetricEntry[]> {
  try {
    console.log(`=== INICIANDO BUSCA DE MÉTRICAS ===`)
    console.log(`Parâmetros:`, {
      startDate: startDate || "TODOS",
      endDate: endDate || "TODOS",
      memberIds: memberIds || "TODOS",
      serviceType: serviceType || "TODOS",
    })

    // APENAS usar dados mockados em ambiente de preview
    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - retornando dados mockados")
      await new Promise((resolve) => setTimeout(resolve, 500))
      let mockData = generateMockMetrics(30)

      // Aplicar filtros aos dados mockados
      if (startDate) {
        mockData = mockData.filter((m) => m.date >= startDate)
      }
      if (endDate) {
        mockData = mockData.filter((m) => m.date <= endDate)
      }
      if (memberIds && memberIds.length > 0) {
        mockData = mockData.filter((m) => memberIds.includes(m.member_id))
      }
      if (serviceType) {
        mockData = mockData.filter((m) => m.service_type === serviceType)
      }

      return mockData
    }

    const supabase = getSupabase()

    if (!supabase) {
      console.error("❌ Cliente Supabase não disponível")
      return []
    }

    // Primeiro, buscar todos os membros para fazer o mapeamento
    console.log("🔄 Buscando membros para mapeamento...")
    const { data: allMembers, error: membersError } = await supabase.from("members").select("id, name, service_type")

    if (membersError) {
      console.error("❌ Erro ao buscar membros:", membersError)
      return []
    }

    console.log(`✅ ${allMembers?.length || 0} membros encontrados`)

    // Criar mapa de membros
    const memberMap = new Map<string, { name: string; service_type: string }>()
    allMembers?.forEach((member) => {
      memberMap.set(member.id, {
        name: member.name,
        service_type: member.service_type || "suporte",
      })
    })

    // Construir query para métricas
    let query = supabase.from("metrics").select("*")

    // Aplicar filtros de data
    if (startDate) {
      query = query.gte("date", startDate)
      console.log(`✅ Filtro aplicado: date >= ${startDate}`)
    }

    if (endDate) {
      query = query.lte("date", endDate)
      console.log(`✅ Filtro aplicado: date <= ${endDate}`)
    }

    // Aplicar filtro de membros
    if (memberIds && memberIds.length > 0) {
      query = query.in("member_id", memberIds)
      console.log(`✅ Filtro aplicado: member_id IN [${memberIds.join(", ")}]`)
    }

    // Aplicar filtro de service_type
    if (serviceType) {
      // Primeiro filtrar os membros pelo service_type
      const filteredMemberIds = Array.from(memberMap.entries())
        .filter(([_, member]) => member.service_type === serviceType)
        .map(([id, _]) => id)

      if (filteredMemberIds.length > 0) {
        query = query.in("member_id", filteredMemberIds)
        console.log(`✅ Filtro aplicado: service_type = ${serviceType} (${filteredMemberIds.length} membros)`)
      } else {
        console.log(`⚠️ Nenhum membro encontrado com service_type = ${serviceType}`)
        return []
      }
    }

    // Ordenar por data
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

    // Processar dados e adicionar informações dos membros
    const processedData = metricsData.map((metric) => {
      const memberInfo = memberMap.get(metric.member_id)
      const memberName = memberInfo?.name || "Desconhecido"
      const memberServiceType = memberInfo?.service_type || metric.service_type || "suporte"

      return {
        id: metric.id,
        member_id: metric.member_id,
        member: memberName,
        date: metric.date,
        resolution_rate: Number(metric.resolution_rate || 0),
        average_response_time: Number(metric.average_response_time || 0),
        csat_score: Number(metric.csat_score || 0),
        evaluated_percentage: Number(metric.evaluated_percentage || 0),
        open_tickets: Number(metric.open_tickets || 0),
        resolved_tickets: Number(metric.resolved_tickets || 0),
        service_type: memberServiceType,
        created_at: metric.created_at,
      }
    })

    const result = snakeToCamel(processedData)

    console.log(`✅ Retornando ${result.length} registros processados`)
    console.log(`📊 Exemplo do primeiro registro:`, result[0])

    return result
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar métricas:", error)
    return []
  }
}

export async function getGenierMetrics(startDate?: string, endDate?: string): Promise<MetricEntry[]> {
  try {
    console.log(`🔍 Buscando métricas Genier`)

    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - retornando dados mockados para Genier")
      return generateMockMetrics(30).filter((m) => m.service_type === "genier")
    }

    // Buscar métricas com service_type = 'genier'
    return await getMetrics(startDate, endDate, undefined, "genier")
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar métricas Genier:", error)
    return []
  }
}

export async function getMemberMetrics(memberId: string, startDate?: string, endDate?: string): Promise<MetricEntry[]> {
  try {
    console.log(`🔍 Buscando métricas do membro ${memberId}`)

    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - retornando dados mockados para membro")
      return generateMockMetrics(30).filter((m) => m.member_id === memberId)
    }

    // Buscar métricas do membro específico
    return await getMetrics(startDate, endDate, [memberId])
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar métricas do membro:", error)
    return []
  }
}

export async function createMetric(metricData: any): Promise<MetricEntry | null> {
  try {
    console.log("📝 Criando nova métrica:", metricData)

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
      console.error("❌ Cliente Supabase não disponível")
      return null
    }

    const date = metricData.date
    console.log(`📅 Data a ser salva no banco: ${date}`)

    const data = {
      member_id: metricData.member_id,
      date: date,
      resolution_rate: formatDecimal(Number(metricData.resolution_rate || 0)),
      average_response_time: formatDecimal(Number(metricData.average_response_time || 0)),
      csat_score: formatDecimal(Number(metricData.csat_score || 0)),
      evaluated_percentage: formatDecimal(Number(metricData.evaluated_percentage || 0)),
      open_tickets: Number(metricData.open_tickets || 0),
      resolved_tickets: Number(metricData.resolved_tickets || 0),
      service_type: metricData.service_type || "suporte",
    }

    console.log("💾 Dados formatados para inserção:", data)

    const { data: result, error } = await supabase.from("metrics").insert([data]).select().single()

    if (error) {
      console.error("❌ Erro ao criar métrica:", error)
      return null
    }

    console.log("✅ Métrica salva com sucesso:", result)

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
    console.error("❌ Erro inesperado ao criar métrica:", error)
    return null
  }
}

export async function updateMetric(id: string, metricData: any): Promise<MetricEntry | null> {
  try {
    console.log(`📝 Atualizando métrica ${id}:`, metricData)

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
      console.error("❌ Cliente Supabase não disponível")
      return null
    }

    const data = {
      resolution_rate: formatDecimal(Number(metricData.resolution_rate || 0)),
      average_response_time: formatDecimal(Number(metricData.average_response_time || 0)),
      csat_score: formatDecimal(Number(metricData.csat_score || 0)),
      evaluated_percentage: formatDecimal(Number(metricData.evaluated_percentage || 0)),
      open_tickets: Number(metricData.open_tickets || 0),
      resolved_tickets: Number(metricData.resolved_tickets || 0),
      service_type: metricData.service_type || "suporte",
    }

    console.log("💾 Dados formatados para atualização:", data)

    const { data: result, error } = await supabase.from("metrics").update(data).eq("id", id).select().single()

    if (error) {
      console.error("❌ Erro ao atualizar métrica:", error)
      return null
    }

    console.log("✅ Métrica atualizada com sucesso:", result)

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
    console.error("❌ Erro inesperado ao atualizar métrica:", error)
    return null
  }
}

export async function deleteMetric(id: string): Promise<boolean> {
  try {
    console.log(`🗑️ Deletando métrica ${id}`)

    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - simulando exclusão de métrica")
      return true
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error("❌ Cliente Supabase não disponível")
      return false
    }

    const { error } = await supabase.from("metrics").delete().eq("id", id)

    if (error) {
      console.error("❌ Erro ao deletar métrica:", error)
      return false
    }

    console.log("✅ Métrica deletada com sucesso")
    return true
  } catch (error) {
    console.error("❌ Erro inesperado ao deletar métrica:", error)
    return false
  }
}

export async function getAggregatedMetrics(startDate?: string, endDate?: string): Promise<DailyMetric[]> {
  try {
    console.log(`📊 Calculando métricas agregadas`)

    const metrics = await getMetrics(startDate, endDate)

    if (metrics.length === 0) {
      console.log("⚠️ Sem métricas para agregar")
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
      const metricsForDate = metrics.filter((m) => m.date === date).length
      dailyMetrics[date].resolution_rate = formatDecimal(dailyMetrics[date].resolution_rate / metricsForDate)
      dailyMetrics[date].average_response_time = formatDecimal(
        dailyMetrics[date].average_response_time / metricsForDate,
      )
      dailyMetrics[date].csat_score = formatDecimal(dailyMetrics[date].csat_score / metricsForDate)
      dailyMetrics[date].evaluated_percentage = formatDecimal(dailyMetrics[date].evaluated_percentage / metricsForDate)
    })

    const result = Object.values(dailyMetrics).sort((a, b) => a.date.localeCompare(b.date))
    console.log(`✅ ${result.length} dias agregados`)

    return result
  } catch (error) {
    console.error("❌ Erro inesperado ao agregar métricas:", error)
    return []
  }
}

export async function getTopPerformers(): Promise<MemberMetrics[]> {
  try {
    console.log(`🏆 Buscando top performers`)

    const members = await getMembers()

    if (members.length === 0) {
      console.log("⚠️ Nenhum membro encontrado")
      return []
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = format(thirtyDaysAgo, "yyyy-MM-dd")

    const metrics = await getMetrics(startDate)

    if (metrics.length === 0) {
      console.log("⚠️ Nenhuma métrica encontrada")
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

    const result = Object.values(memberMetrics)
      .filter((item) => item.metrics.length > 0)
      .sort((a, b) => {
        const aAvgCsat = a.metrics.reduce((sum, m) => sum + m.csat_score, 0) / a.metrics.length
        const bAvgCsat = b.metrics.reduce((sum, m) => sum + m.csat_score, 0) / b.metrics.length
        return bAvgCsat - aAvgCsat
      })

    console.log(`✅ ${result.length} performers encontrados`)
    return result
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar top performers:", error)
    return []
  }
}

export async function uploadMetricsFromCSV(csvData: any[]): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📤 Importando ${csvData.length} registros do CSV`)

    if (isPreviewEnvironment()) {
      console.log("🔄 Ambiente de preview - simulando upload de CSV")
      return { success: true, message: `${csvData.length} registros importados com sucesso (simulado)` }
    }

    const supabase = getSupabase()
    if (!supabase) {
      console.error("❌ Cliente Supabase não disponível")
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
      service_type: row.service_type || "suporte",
    }))

    const { error } = await supabase.from("metrics").insert(formattedData)

    if (error) throw error

    console.log(`✅ ${formattedData.length} registros importados com sucesso`)
    return { success: true, message: `${formattedData.length} registros importados com sucesso` }
  } catch (error) {
    console.error("❌ Erro ao importar métricas:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido ao importar dados",
    }
  }
}
