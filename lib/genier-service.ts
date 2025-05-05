import { getSupabase } from "./supabase"
import type { GenierProject, GenierStats } from "./types"

// Função para buscar todos os projetos Genier
export async function getGenierProjects(
  filters: {
    status?: string
    consultor?: string
    startDate?: string
    endDate?: string
    cliente?: string
    tipo?: string
  } = {},
): Promise<GenierProject[]> {
  try {
    const supabase = getSupabase()
    let query = supabase.from("metrics_genier").select("*")

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
      console.error("Erro ao buscar projetos Genier:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro inesperado ao buscar projetos Genier:", error)
    return []
  }
}

// Função para buscar um projeto Genier específico
export async function getGenierProjectById(id: string): Promise<GenierProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_genier").select("*").eq("id", id).single()

    if (error) {
      console.error("Erro ao buscar projeto Genier:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro inesperado ao buscar projeto Genier:", error)
    return null
  }
}

// Função para criar um novo projeto Genier
export async function createGenierProject(
  project: Omit<GenierProject, "id" | "created_at" | "updated_at">,
): Promise<GenierProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_genier").insert([project]).select().single()

    if (error) {
      console.error("Erro ao criar projeto Genier:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro inesperado ao criar projeto Genier:", error)
    return null
  }
}

// Função para atualizar um projeto Genier existente
export async function updateGenierProject(
  id: string,
  project: Partial<Omit<GenierProject, "id" | "created_at" | "updated_at">>,
): Promise<GenierProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("metrics_genier")
      .update({ ...project, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar projeto Genier:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro inesperado ao atualizar projeto Genier:", error)
    return null
  }
}

// Função para excluir um projeto Genier
export async function deleteGenierProject(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from("metrics_genier").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir projeto Genier:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro inesperado ao excluir projeto Genier:", error)
    return false
  }
}

// Função para calcular estatísticas dos projetos Genier
export async function getGenierStats(): Promise<GenierStats> {
  try {
    const projects = await getGenierProjects()

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
    const averageProjectDuration = projects.reduce((sum, p) => sum + (p.tempo_dias || 0), 0) / projects.length

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
    console.error("Erro ao calcular estatísticas Genier:", error)
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

// Função para obter tipos de projetos Genier únicos
export async function getGenierProjectTypes(): Promise<string[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_genier").select("tipo").order("tipo")

    if (error) {
      console.error("Erro ao buscar tipos de projetos Genier:", error)
      return []
    }

    // Extrair tipos únicos
    const types = [...new Set(data.map((item) => item.tipo))]
    return types
  } catch (error) {
    console.error("Erro inesperado ao buscar tipos de projetos Genier:", error)
    return []
  }
}

// Função para obter consultores únicos
export async function getGenierConsultants(): Promise<string[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_genier").select("consultor").order("consultor")

    if (error) {
      console.error("Erro ao buscar consultores Genier:", error)
      return []
    }

    // Extrair consultores únicos (excluindo nulos)
    const consultants = [...new Set(data.map((item) => item.consultor).filter(Boolean))]
    return consultants
  } catch (error) {
    console.error("Erro inesperado ao buscar consultores Genier:", error)
    return []
  }
}

// Função para obter portes de projetos únicos
export async function getGenierProjectSizes(): Promise<string[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_genier").select("porte").order("porte")

    if (error) {
      console.error("Erro ao buscar portes de projetos Genier:", error)
      return []
    }

    // Extrair portes únicos
    const sizes = [...new Set(data.map((item) => item.porte))]
    return sizes
  } catch (error) {
    console.error("Erro inesperado ao buscar portes de projetos Genier:", error)
    return []
  }
}
