import { getSupabase } from "./supabase"
import type { SupportProject, SupportStats } from "./types"

// Nome da tabela no Supabase
const TABLE_NAME = "metrics_support" // Ajuste para o nome correto da tabela

// Função para buscar todos os projetos de suporte
export async function getSupportProjects(
  filters: {
    status?: string
    consultor?: string
    startDate?: string
    endDate?: string
    cliente?: string
    tipo?: string
  } = {},
): Promise<SupportProject[]> {
  try {
    const supabase = getSupabase()
    let query = supabase.from(TABLE_NAME).select("*")

    // Aplicar filtros
    if (filters.status) {
      query = query.eq("status", filters.status)
    }

    if (filters.consultor) {
      query = query.eq("consultor", filters.consultor)
    }

    if (filters.cliente) {
      query = query.ilike("cliente", `%${filters.cliente}%`)
    }

    if (filters.tipo) {
      query = query.eq("tipo", filters.tipo)
    }

    if (filters.startDate) {
      query = query.gte("data_inicio", filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte("data_termino", filters.endDate)
    }

    // Ordenar por data de início (mais recente primeiro)
    query = query.order("data_inicio", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar projetos de suporte:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro inesperado ao buscar projetos de suporte:", error)
    return []
  }
}

// Função para buscar um projeto de suporte específico
export async function getSupportProjectById(id: string): Promise<SupportProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from(TABLE_NAME).select("*").eq("id", id).single()

    if (error) {
      console.error("Erro ao buscar projeto de suporte:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro inesperado ao buscar projeto de suporte:", error)
    return null
  }
}

// Função para criar um novo projeto de suporte
export async function createSupportProject(
  project: Omit<SupportProject, "id" | "created_at" | "updated_at">,
): Promise<SupportProject | null> {
  try {
    const supabase = getSupabase()

    // Adicionar timestamps
    const projectWithTimestamps = {
      ...project,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from(TABLE_NAME).insert([projectWithTimestamps]).select().single()

    if (error) {
      console.error("Erro ao criar projeto de suporte:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro inesperado ao criar projeto de suporte:", error)
    return null
  }
}

// Função para atualizar um projeto de suporte existente
export async function updateSupportProject(
  id: string,
  project: Partial<Omit<SupportProject, "id" | "created_at" | "updated_at">>,
): Promise<SupportProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ ...project, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar projeto de suporte:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro inesperado ao atualizar projeto de suporte:", error)
    return null
  }
}

// Função para excluir um projeto de suporte
export async function deleteSupportProject(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir projeto de suporte:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro inesperado ao excluir projeto de suporte:", error)
    return false
  }
}

// Função para calcular estatísticas dos projetos de suporte
export async function getSupportStats(): Promise<SupportStats> {
  try {
    const projects = await getSupportProjects()

    if (!projects.length) {
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

    const activeProjects = projects.filter((p) => p.status === "em_andamento")
    const completedProjects = projects.filter((p) => p.status === "concluido")

    // Calcular média de avaliação
    const projectsWithRating = projects.filter(
      (p) => p.avaliacao_estrelas !== null && p.avaliacao_estrelas !== undefined,
    )
    const averageRating = projectsWithRating.length
      ? projectsWithRating.reduce((sum, p) => sum + (p.avaliacao_estrelas || 0), 0) / projectsWithRating.length
      : 0

    // Calcular receita total
    const totalRevenue = projects.reduce((sum, p) => sum + (p.valor_consultoria || 0), 0)

    // Calcular duração média dos projetos
    const projectsWithDuration = projects.filter((p) => p.tempo_dias !== null && p.tempo_dias !== undefined)
    const averageProjectDuration = projectsWithDuration.length
      ? projectsWithDuration.reduce((sum, p) => sum + (p.tempo_dias || 0), 0) / projectsWithDuration.length
      : 0

    // Calcular taxa de cumprimento de prazo
    const projectsWithDeadlineInfo = completedProjects.filter(
      (p) => p.prazo_atingido !== null && p.prazo_atingido !== undefined,
    )
    const deadlineComplianceRate = projectsWithDeadlineInfo.length
      ? (projectsWithDeadlineInfo.filter((p) => p.prazo_atingido).length / projectsWithDeadlineInfo.length) * 100
      : 0

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      averageRating,
      totalRevenue,
      averageProjectDuration,
      deadlineComplianceRate,
    }
  } catch (error) {
    console.error("Erro ao calcular estatísticas de suporte:", error)
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

// Função para obter tipos de projetos de suporte únicos
export async function getSupportProjectTypes(): Promise<string[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from(TABLE_NAME).select("tipo").order("tipo")

    if (error) {
      console.error("Erro ao buscar tipos de projetos de suporte:", error)
      return []
    }

    // Extrair tipos únicos (excluindo nulos)
    const types = [...new Set(data.map((item) => item.tipo).filter(Boolean))]
    return types
  } catch (error) {
    console.error("Erro inesperado ao buscar tipos de projetos de suporte:", error)
    return []
  }
}

// Função para obter consultores únicos
export async function getSupportConsultants(): Promise<string[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from(TABLE_NAME).select("consultor").order("consultor")

    if (error) {
      console.error("Erro ao buscar consultores de suporte:", error)
      return []
    }

    // Extrair consultores únicos (excluindo nulos)
    const consultants = [...new Set(data.map((item) => item.consultor).filter(Boolean))]
    return consultants
  } catch (error) {
    console.error("Erro inesperado ao buscar consultores de suporte:", error)
    return []
  }
}

// Função para obter portes de projetos únicos
export async function getSupportProjectSizes(): Promise<string[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from(TABLE_NAME).select("porte").order("porte")

    if (error) {
      console.error("Erro ao buscar portes de projetos de suporte:", error)
      return []
    }

    // Extrair portes únicos (excluindo nulos)
    const sizes = [...new Set(data.map((item) => item.porte).filter(Boolean))]
    return sizes
  } catch (error) {
    console.error("Erro inesperado ao buscar portes de projetos de suporte:", error)
    return []
  }
}
