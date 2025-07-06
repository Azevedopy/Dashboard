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

    // Map the data to match the database schema - removing 'data' column
    const dbData = {
      consultor: metricData.consultor,
      cliente: metricData.client,
      tipo: metricData.project_type,
      status: metricData.status,
      porte: metricData.size,
      data_inicio: metricData.start_date,
      data_termino: metricData.end_date,
      tempo_dias: metricData.duration,
      valor_consultoria: metricData.consulting_value,
      valor_bonus: metricData.bonus_8_percent,
      bonificada: metricData.is_bonificada || false,
      dias_pausados: 0, // Novo projeto sempre começa com 0 dias pausados
      data_pausa: null, // Novo projeto não está pausado
      assinatura_fechamento: false, // Novo projeto não tem assinatura ainda
      // Add evaluation fields if status is completed
      ...(metricData.status === "concluido" && {
        avaliacao_estrelas: metricData.avaliacao_estrelas,
        nota_consultoria: metricData.nota_consultoria,
        data_finalizacao: metricData.data_finalizacao,
        prazo_atingido: metricData.prazo_atingido,
        valor_comissao: metricData.valor_comissao,
        percentual_comissao: metricData.percentual_comissao,
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("📝 Dados formatados para o banco:", dbData)

    const { data, error } = await supabase.from("metrics_consultoria").insert([dbData]).select().single()

    if (error) {
      console.error("❌ Erro ao inserir no banco:", error)
      return {
        success: false,
        error: `Erro no banco de dados: ${error.message}`,
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
