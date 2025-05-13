import { getSupabase } from "./supabase"
import type { ConsultingProject, ConsultingStats, ConsultingMetric } from "./types"

// Function to fetch all consulting projects
export async function getConsultingProjects(
  filters: {
    status?: string
    consultor?: string
    startDate?: string
    endDate?: string
  } = {},
): Promise<ConsultingProject[]> {
  try {
    const supabase = getSupabase()
    let query = supabase.from("metrics_consultoria").select("*")

    if (filters.status) {
      query = query.eq("status", filters.status)
    }

    if (filters.consultor) {
      query = query.eq("consultor", filters.consultor)
    }

    if (filters.startDate) {
      query = query.gte("data_inicio", filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte("data_termino", filters.endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching consulting projects:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching consulting projects:", error)
    return []
  }
}

// Function to fetch a consulting project by ID
export async function getConsultingProjectById(id: string): Promise<ConsultingProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_consultoria").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching consulting project:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error fetching consulting project:", error)
    return null
  }
}

// Function to create a new consulting project
export async function createConsultingProject(
  project: Omit<ConsultingProject, "id" | "created_at" | "updated_at">,
): Promise<ConsultingProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_consultoria").insert([project]).select().single()

    if (error) {
      console.error("Error creating consulting project:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error creating consulting project:", error)
    return null
  }
}

// Function to update an existing consulting project
export async function updateConsultingProject(project: Partial<ConsultingProject>): Promise<ConsultingProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("metrics_consultoria")
      .update(project)
      .eq("id", project.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating consulting project:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error updating consulting project:", error)
    return null
  }
}

// Function to delete a consulting project
export async function deleteConsultingProject(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from("metrics_consultoria").delete().eq("id", id)

    if (error) {
      console.error("Error deleting consulting project:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Unexpected error deleting consulting project:", error)
    return false
  }
}

// Function to calculate consulting stats
export async function getConsultingStats(
  filters: {
    status?: string
    consultor?: string
    startDate?: string
    endDate?: string
  } = {},
): Promise<ConsultingStats> {
  try {
    const projects = await getConsultingProjects(filters)

    const totalProjects = projects.length
    const activeProjects = projects.filter((project) => project.status === "em_andamento").length
    const completedProjects = projects.filter((project) => project.status === "concluido").length

    let totalRating = 0
    let validRatingCount = 0
    projects.forEach((project) => {
      if (project.avaliacao_estrelas) {
        totalRating += project.avaliacao_estrelas
        validRatingCount++
      }
    })
    const averageRating = validRatingCount > 0 ? totalRating / validRatingCount : 0

    let totalRevenue = 0
    projects.forEach((project) => {
      totalRevenue += project.valor_consultoria || 0
    })

    let totalDuration = 0
    projects.forEach((project) => {
      totalDuration += project.tempo_dias || 0
    })
    const averageProjectDuration = totalProjects > 0 ? totalDuration / totalProjects : 0

    let deadlineComplianceCount = 0
    projects.forEach((project) => {
      if (project.prazo_atingido) {
        deadlineComplianceCount++
      }
    })
    const deadlineComplianceRate = totalProjects > 0 ? (deadlineComplianceCount / totalProjects) * 100 : 0

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      averageRating,
      totalRevenue,
      averageProjectDuration,
      deadlineComplianceRate,
    }
  } catch (error) {
    console.error("Error calculating consulting stats:", error)
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

// Function to get unique consultant names
export async function getConsultores(): Promise<string[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_consultoria").select("consultor").order("consultor")

    if (error) {
      console.error("Error fetching consultores:", error)
      return []
    }

    // Extract unique consultant names
    const consultores = [...new Set(data.map((item) => item.consultor))]
      .filter(Boolean) // Remove null or undefined values
      .sort() // Sort alphabetically

    return consultores
  } catch (error) {
    console.error("Unexpected error fetching consultores:", error)
    return []
  }
}

// Nova função para criar métricas de consultoria
export async function createConsultingMetric(metric: ConsultingMetric): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Criando métrica de consultoria:", metric)

    const supabase = getSupabase()

    // Mapeando os campos da métrica para o formato esperado pela tabela metrics_consultoria
    const projectData = {
      cliente: metric.client,
      tipo: metric.project_type,
      consultor: metric.consultor,
      data_inicio: metric.start_date,
      data_termino: metric.end_date,
      tempo_dias: metric.duration,
      porte: metric.size,
      porte_detalhado: metric.size_detail,
      data_fechamento: metric.closing_date,
      data_virada: metric.turning_date,
      valor_consultoria: metric.consulting_value,
      valor_bonus: metric.bonus_8_percent,
      valor_bonus_12: metric.bonus_12_percent,
      status: metric.status,
      // Campos adicionais que podem ser necessários
      member_id: metric.member_id,
    }

    const { data, error } = await supabase.from("metrics_consultoria").insert([projectData])

    if (error) {
      console.error("Erro ao criar métrica de consultoria:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro inesperado ao criar métrica de consultoria:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao criar métrica de consultoria",
    }
  }
}
