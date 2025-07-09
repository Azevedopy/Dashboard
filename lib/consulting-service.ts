import { supabase } from "@/lib/supabase"
import type { ConsultingProject, ConsultingStats } from "@/lib/types"

// Mock data for development/testing
const mockConsultingProjects: ConsultingProject[] = [
  {
    id: "1",
    cliente: "Empresa ABC Ltda",
    tipo: "consultoria",
    data_inicio: "2024-01-15",
    data_termino: "2024-02-15",
    tempo_dias: 31,
    porte: "pro",
    avaliacao: "Excelente",
    valor_consultoria: 15000,
    valor_bonus: 1200,
    consultor: "João Silva",
    avaliacao_estrelas: 5,
    prazo_atingido: true,
    status: "concluido",
    data_finalizacao: "2024-02-14",
    valor_comissao: 1500,
    percentual_comissao: 10,
    bonificada: false,
    dias_pausados: 0,
  },
  {
    id: "2",
    cliente: "Tech Solutions Inc",
    tipo: "upsell",
    data_inicio: "2024-01-20",
    data_termino: "2024-03-20",
    tempo_dias: 60,
    porte: "enterprise",
    avaliacao: "Muito Bom",
    valor_consultoria: 25000,
    valor_bonus: 2000,
    consultor: "Maria Santos",
    avaliacao_estrelas: 4,
    prazo_atingido: true,
    status: "concluido",
    data_finalizacao: "2024-03-18",
    valor_comissao: 2500,
    percentual_comissao: 10,
    bonificada: true,
    dias_pausados: 0,
  },
  {
    id: "3",
    cliente: "StartupXYZ",
    tipo: "consultoria",
    data_inicio: "2024-02-01",
    data_termino: "2024-02-28",
    tempo_dias: 27,
    porte: "basic",
    avaliacao: "Bom",
    valor_consultoria: 8000,
    valor_bonus: 640,
    consultor: "Pedro Costa",
    avaliacao_estrelas: 4,
    prazo_atingido: false,
    status: "concluido",
    data_finalizacao: "2024-03-05",
    valor_comissao: 800,
    percentual_comissao: 10,
    bonificada: false,
    dias_pausados: 0,
  },
  {
    id: "4",
    cliente: "Inovação Digital",
    tipo: "consultoria",
    data_inicio: "2024-02-10",
    data_termino: "2024-03-10",
    tempo_dias: 29,
    porte: "pro",
    avaliacao: "Excelente",
    valor_consultoria: 18000,
    valor_bonus: 1440,
    consultor: "Ana Oliveira",
    avaliacao_estrelas: 5,
    prazo_atingido: true,
    status: "concluido",
    data_finalizacao: "2024-03-08",
    valor_comissao: 1800,
    percentual_comissao: 10,
    bonificada: false,
    dias_pausados: 0,
  },
  {
    id: "5",
    cliente: "Mega Corp",
    tipo: "upsell",
    data_inicio: "2024-01-05",
    data_termino: "2024-04-05",
    tempo_dias: 91,
    porte: "enterprise",
    avaliacao: "Muito Bom",
    valor_consultoria: 35000,
    valor_bonus: 2800,
    consultor: "Carlos Lima",
    avaliacao_estrelas: 4,
    prazo_atingido: true,
    status: "concluido",
    data_finalizacao: "2024-04-03",
    valor_comissao: 3500,
    percentual_comissao: 10,
    bonificada: true,
    dias_pausados: 0,
  },
]

export async function getConsultingProjects(filters?: {
  consultor?: string
  tipo?: string
  status?: string
  startDate?: string
  endDate?: string
}): Promise<ConsultingProject[]> {
  try {
    console.log("🔍 Buscando projetos de consultoria com filtros:", filters)

    let query = supabase.from("metrics_consultoria").select("*")

    // Apply filters
    if (filters?.consultor && filters.consultor !== "todos") {
      query = query.eq("consultor", filters.consultor)
    }

    if (filters?.tipo && filters.tipo !== "todos") {
      query = query.eq("tipo", filters.tipo)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.startDate) {
      query = query.gte("data_inicio", filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte("data_termino", filters.endDate)
    }

    const { data, error } = await query.order("data_inicio", { ascending: false })

    if (error) {
      console.error("❌ Erro ao buscar projetos de consultoria:", error)
      console.log("🔄 Usando dados mockados como fallback")

      // Apply filters to mock data
      let filteredMockData = mockConsultingProjects

      if (filters?.consultor && filters.consultor !== "todos") {
        filteredMockData = filteredMockData.filter((p) => p.consultor === filters.consultor)
      }

      if (filters?.tipo && filters.tipo !== "todos") {
        filteredMockData = filteredMockData.filter((p) => p.tipo === filters.tipo)
      }

      if (filters?.status) {
        filteredMockData = filteredMockData.filter((p) => p.status === filters.status)
      }

      return filteredMockData
    }

    console.log(`✅ Encontrados ${data?.length || 0} projetos de consultoria`)

    // Garantir que campos de pausa tenham valores padrão se não existirem
    const processedData = (data || []).map((project) => ({
      ...project,
      dias_pausados: project.dias_pausados ?? 0,
      data_pausa: project.data_pausa ?? null,
      assinatura_fechamento: project.assinatura_fechamento ?? false,
    }))

    return processedData
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar projetos:", error)
    console.log("🔄 Usando dados mockados como fallback")
    return mockConsultingProjects
  }
}

export async function getConsultores(): Promise<string[]> {
  try {
    console.log("🔍 Buscando lista de consultores...")

    const { data, error } = await supabase.from("metrics_consultoria").select("consultor").not("consultor", "is", null)

    if (error) {
      console.error("❌ Erro ao buscar consultores:", error)
      console.log("🔄 Usando consultores mockados como fallback")
      return ["João Silva", "Maria Santos", "Pedro Costa", "Ana Oliveira", "Carlos Lima"]
    }

    const consultores = [...new Set(data?.map((item) => item.consultor).filter(Boolean))] as string[]
    console.log(`✅ Encontrados ${consultores.length} consultores únicos`)
    return consultores.sort()
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar consultores:", error)
    console.log("🔄 Usando consultores mockados como fallback")
    return ["João Silva", "Maria Santos", "Pedro Costa", "Ana Oliveira", "Carlos Lima"]
  }
}

export async function getConsultingStats(filters?: {
  consultor?: string
  tipo?: string
  status?: string
  startDate?: string
  endDate?: string
}): Promise<ConsultingStats> {
  try {
    console.log("📊 Calculando estatísticas de consultoria...")

    const projects = await getConsultingProjects(filters)

    const completedProjects = projects.filter((p) => p.status === "concluido")
    const activeProjects = projects.filter((p) => p.status === "em_andamento")

    const projectsWithRating = completedProjects.filter((p) => p.avaliacao_estrelas && p.avaliacao_estrelas > 0)
    const projectsWithDuration = completedProjects.filter((p) => p.tempo_dias && p.tempo_dias > 0)
    const onTimeProjects = completedProjects.filter((p) => p.prazo_atingido === true)

    const stats: ConsultingStats = {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      averageRating:
        projectsWithRating.length > 0
          ? projectsWithRating.reduce((sum, p) => sum + (p.avaliacao_estrelas || 0), 0) / projectsWithRating.length
          : 0,
      totalRevenue: projects.reduce((sum, p) => sum + (p.valor_consultoria || 0), 0),
      averageProjectDuration:
        projectsWithDuration.length > 0
          ? projectsWithDuration.reduce((sum, p) => sum + (p.tempo_dias || 0), 0) / projectsWithDuration.length
          : 0,
      deadlineComplianceRate:
        completedProjects.length > 0 ? (onTimeProjects.length / completedProjects.length) * 100 : 0,
    }

    console.log("✅ Estatísticas calculadas:", stats)
    return stats
  } catch (error) {
    console.error("❌ Erro ao calcular estatísticas:", error)

    // Return default stats
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      averageRating: 0,
      totalRevenue: 0,
      averageProjectDuration: 0,
      deadlineComplianceRate: 0,
    }
  }
}

export async function createConsultingProject(project: Partial<ConsultingProject>): Promise<ConsultingProject> {
  try {
    console.log("➕ Criando novo projeto de consultoria:", project)

    const { data, error } = await supabase.from("metrics_consultoria").insert([project]).select().single()

    if (error) {
      console.error("❌ Erro ao criar projeto:", error)
      throw error
    }

    console.log("✅ Projeto criado com sucesso:", data)
    return data
  } catch (error) {
    console.error("❌ Erro inesperado ao criar projeto:", error)
    throw error
  }
}

export async function updateConsultingProject(projectData: {
  id: string
  [key: string]: any
}): Promise<ConsultingProject> {
  try {
    const { id, ...updateData } = projectData
    console.log("✏️ Atualizando projeto de consultoria:", id, "com dados:", updateData)

    // Clean the update data - remove undefined values and ensure proper types
    const cleanUpdateData: Record<string, any> = {}

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Permitir null para limpar campos como data_pausa
        cleanUpdateData[key] = value
      }
    })

    console.log("📝 Dados limpos para atualização:", cleanUpdateData)

    if (Object.keys(cleanUpdateData).length === 0) {
      throw new Error("Nenhum dado válido para atualizar")
    }

    // Verificar se as colunas existem antes de tentar atualizar
    const { data: schemaData, error: schemaError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "metrics_consultoria")

    if (schemaError) {
      console.warn("⚠️ Não foi possível verificar schema, continuando com update...")
    } else {
      const existingColumns = schemaData?.map((col) => col.column_name) || []
      console.log("📋 Colunas existentes na tabela:", existingColumns)

      // Filtrar apenas campos que existem na tabela
      const filteredUpdateData: Record<string, any> = {}
      Object.entries(cleanUpdateData).forEach(([key, value]) => {
        if (existingColumns.includes(key)) {
          filteredUpdateData[key] = value
        } else {
          console.warn(`⚠️ Coluna '${key}' não existe na tabela, ignorando...`)
        }
      })

      if (Object.keys(filteredUpdateData).length === 0) {
        throw new Error("Nenhuma coluna válida para atualizar")
      }

      console.log("📝 Dados filtrados para atualização:", filteredUpdateData)
      Object.assign(cleanUpdateData, filteredUpdateData)
    }

    const { data, error } = await supabase
      .from("metrics_consultoria")
      .update(cleanUpdateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Erro ao atualizar projeto:", error)
      throw new Error(`Erro ao atualizar projeto: ${error.message}`)
    }

    if (!data) {
      throw new Error("Projeto não encontrado ou não foi possível atualizar")
    }

    console.log("✅ Projeto atualizado com sucesso:", data)

    // Garantir que campos de pausa tenham valores padrão
    const processedData = {
      ...data,
      dias_pausados: data.dias_pausados ?? 0,
      data_pausa: data.data_pausa ?? null,
      assinatura_fechamento: data.assinatura_fechamento ?? false,
    }

    return processedData
  } catch (error) {
    console.error("❌ Erro na função updateConsultingProject:", error)
    throw error
  }
}

export async function deleteConsultingProject(id: string): Promise<void> {
  try {
    console.log("🗑️ Deletando projeto de consultoria:", id)

    const { error } = await supabase.from("metrics_consultoria").delete().eq("id", id)

    if (error) {
      console.error("❌ Erro ao deletar projeto:", error)
      throw error
    }

    console.log("✅ Projeto deletado com sucesso")
  } catch (error) {
    console.error("❌ Erro inesperado ao deletar projeto:", error)
    throw error
  }
}

export async function getConsultingProject(id: string): Promise<ConsultingProject | null> {
  try {
    console.log("🔍 Buscando projeto de consultoria por ID:", id)

    const { data, error } = await supabase.from("metrics_consultoria").select("*").eq("id", id).single()

    if (error) {
      console.error("❌ Erro ao buscar projeto:", error)

      // Try to find in mock data
      const mockProject = mockConsultingProjects.find((p) => p.id === id)
      if (mockProject) {
        console.log("🔄 Projeto encontrado nos dados mockados")
        return mockProject
      }

      return null
    }

    console.log("✅ Projeto encontrado:", data)

    // Garantir que campos de pausa tenham valores padrão
    const processedData = {
      ...data,
      dias_pausados: data.dias_pausados ?? 0,
      data_pausa: data.data_pausa ?? null,
      assinatura_fechamento: data.assinatura_fechamento ?? false,
    }

    return processedData
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar projeto:", error)
    return null
  }
}

export async function getCompletedConsultingProjects(): Promise<ConsultingProject[]> {
  return getConsultingProjects({ status: "concluido" })
}

export async function getActiveConsultingProjects(): Promise<ConsultingProject[]> {
  return getConsultingProjects({ status: "em_andamento" })
}

// Função auxiliar para validar e converter valores numéricos
function parseNumericValue(value: any): number | null {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value)
  return isNaN(parsed) ? null : parsed
}

// Função auxiliar para validar e converter valores inteiros
function parseIntegerValue(value: any): number | null {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value)
  return isNaN(parsed) ? null : parsed
}

// Função auxiliar para validar strings
function parseStringValue(value: any): string | null {
  if (value === null || value === undefined || value === "") {
    return null
  }
  return String(value).trim()
}

// Função auxiliar para validar booleanos
function parseBooleanValue(value: any): boolean {
  if (value === null || value === undefined) {
    return false
  }
  return Boolean(value)
}

export async function createConsultingMetric(metricData: {
  date: string
  member_id?: string
  consultor: string
  client: string
  project_type: string
  status: string
  size: string
  size_detail: string
  start_date: string
  end_date: string
  duration: number
  consulting_value: number
  bonus_8_percent: number
  bonus_12_percent: number
  is_bonificada?: boolean
  avaliacao_estrelas?: number
  nota_consultoria?: string
  data_finalizacao?: string
  prazo_atingido?: boolean
  valor_comissao?: number
  percentual_comissao?: number
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log("🔄 Criando métrica de consultoria:", metricData)

    // Normalizar o tipo corretamente - manter capitalização original
    const normalizedType = metricData.project_type.trim()

    // Validar e limpar dados antes de enviar para o banco
    const cleanedData = {
      consultor: parseStringValue(metricData.consultor),
      cliente: parseStringValue(metricData.client),
      tipo: normalizedType, // Usar tipo normalizado sem conversão para lowercase
      status: parseStringValue(metricData.status),
      porte: parseStringValue(metricData.size),
      data_inicio: parseStringValue(metricData.start_date),
      data_termino: parseStringValue(metricData.end_date),
      tempo_dias: parseIntegerValue(metricData.duration),
      valor_consultoria: parseNumericValue(metricData.consulting_value),
      valor_bonus: parseNumericValue(metricData.bonus_8_percent),
      valor_bonus_12: parseNumericValue(metricData.bonus_12_percent),
      bonificada: parseBooleanValue(metricData.is_bonificada),
      dias_pausados: 0,
      data_pausa: null,
      assinatura_fechamento: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Adicionar campos de avaliação apenas se status for concluído
    if (metricData.status === "concluido") {
      Object.assign(cleanedData, {
        avaliacao_estrelas: parseIntegerValue(metricData.avaliacao_estrelas),
        nota_consultoria: parseStringValue(metricData.nota_consultoria),
        data_finalizacao: parseStringValue(metricData.data_finalizacao),
        prazo_atingido: parseBooleanValue(metricData.prazo_atingido),
        valor_comissao: parseNumericValue(metricData.valor_comissao),
        percentual_comissao: parseNumericValue(metricData.percentual_comissao),
      })
    }

    console.log("📝 Dados limpos para inserção:", cleanedData)

    // Validar campos obrigatórios
    const requiredFields = ["consultor", "cliente", "tipo", "status", "porte", "data_inicio", "data_termino"]
    const missingFields = requiredFields.filter((field) => !cleanedData[field as keyof typeof cleanedData])

    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(", ")}`)
    }

    // Validar valores específicos - manter capitalização correta
    const validTipos = ["Consultoria", "Upsell"]
    if (!validTipos.includes(cleanedData.tipo!)) {
      console.error("❌ Tipo inválido recebido:", {
        tipoRecebido: cleanedData.tipo,
        tipoOriginal: metricData.project_type,
        tiposValidos: validTipos,
      })
      throw new Error(`Tipo inválido: ${cleanedData.tipo}. Valores aceitos: ${validTipos.join(", ")}`)
    }

    const validPortes = ["basic", "starter", "pro", "enterprise"]
    if (!validPortes.includes(cleanedData.porte!)) {
      throw new Error(`Porte inválido: ${cleanedData.porte}. Valores aceitos: ${validPortes.join(", ")}`)
    }

    const validStatus = ["em_andamento", "concluido", "cancelado"]
    if (!validStatus.includes(cleanedData.status!)) {
      throw new Error(`Status inválido: ${cleanedData.status}. Valores aceitos: ${validStatus.join(", ")}`)
    }

    // Se for concluído, validar campos de avaliação
    if (cleanedData.status === "concluido") {
      if (!cleanedData.avaliacao_estrelas || cleanedData.avaliacao_estrelas < 1 || cleanedData.avaliacao_estrelas > 5) {
        throw new Error("Avaliação por estrelas é obrigatória para projetos concluídos (1-5)")
      }
    }

    console.log("✅ Dados validados, inserindo no banco:", {
      tipo: cleanedData.tipo,
      cliente: cleanedData.cliente,
      consultor: cleanedData.consultor,
      status: cleanedData.status,
    })

    const { data, error } = await supabase.from("metrics_consultoria").insert([cleanedData]).select().single()

    if (error) {
      console.error("❌ Erro ao inserir no banco:", error)

      // Análise específica do erro
      let errorMessage = `Erro no banco de dados: ${error.message}`

      if (error.message.includes("invalid input syntax for type integer")) {
        errorMessage = `❌ Erro de tipo de dados: Um campo numérico recebeu um valor inválido. Verifique se todos os números estão corretos.`
      } else if (error.message.includes("check constraint")) {
        errorMessage = `❌ Erro de validação: ${error.message}. Verifique se os valores estão dentro dos limites aceitos.`
      } else if (error.message.includes("not-null constraint")) {
        errorMessage = `❌ Campo obrigatório não preenchido: ${error.message}`
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    console.log("✅ Métrica criada com sucesso:", data)
    return {
      success: true,
      data: data,
    }
  } catch (error) {
    console.error("❌ Erro na função createConsultingMetric:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
