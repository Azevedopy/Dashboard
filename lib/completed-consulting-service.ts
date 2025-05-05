import { getSupabase } from "@/lib/supabase"
import type { ConsultingProject, ConsultingStats } from "@/lib/types"

// Buscar projetos de consultoria concluídos
export async function getCompletedConsultingProjects(filters?: {
  startDate?: string
  endDate?: string
  consultor?: string
}): Promise<ConsultingProject[]> {
  try {
    const supabase = getSupabase()
    let query = supabase.from("view_consultorias_concluidas").select("*")

    // Aplicar filtros
    if (filters) {
      if (filters.startDate) {
        query = query.gte("data_inicio", filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte("data_termino", filters.endDate)
      }
      if (filters.consultor) {
        query = query.eq("consultor", filters.consultor)
      }
    }

    // Ordenar por data de finalização (mais recente primeiro)
    query = query.order("data_finalizacao", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching completed consulting projects:", error)
      throw error
    }

    return data as ConsultingProject[]
  } catch (error) {
    console.error("Error in getCompletedConsultingProjects:", error)
    return []
  }
}

// Buscar estatísticas de consultorias concluídas
export async function getCompletedConsultingStats(filters?: {
  startDate?: string
  endDate?: string
}): Promise<ConsultingStats> {
  try {
    const projects = await getCompletedConsultingProjects(filters)

    if (!projects.length) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: projects.length,
        averageRating: 0,
        totalRevenue: 0,
        averageProjectDuration: 0,
        deadlineComplianceRate: 0,
      }
    }

    // Calcular estatísticas
    const totalRevenue = projects.reduce((sum, project) => sum + (project.valor_consultoria || 0), 0)

    const projectsWithRating = projects.filter(
      (p) => p.avaliacao_estrelas !== null && p.avaliacao_estrelas !== undefined,
    )
    const averageRating = projectsWithRating.length
      ? projectsWithRating.reduce((sum, p) => sum + (p.avaliacao_estrelas || 0), 0) / projectsWithRating.length
      : 0

    const averageProjectDuration = projects.reduce((sum, p) => sum + (p.tempo_dias || 0), 0) / projects.length

    const projectsWithDeadlineInfo = projects.filter((p) => p.prazo_atingido !== null && p.prazo_atingido !== undefined)
    const deadlineComplianceRate = projectsWithDeadlineInfo.length
      ? (projectsWithDeadlineInfo.filter((p) => p.prazo_atingido).length / projectsWithDeadlineInfo.length) * 100
      : 0

    return {
      totalProjects: 0, // Não relevante para consultorias concluídas
      activeProjects: 0, // Não relevante para consultorias concluídas
      completedProjects: projects.length,
      averageRating,
      totalRevenue,
      averageProjectDuration,
      deadlineComplianceRate,
    }
  } catch (error) {
    console.error("Error in getCompletedConsultingStats:", error)
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

// Buscar lista de consultores que têm projetos concluídos
export async function getCompletedConsultores(): Promise<string[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("view_consultorias_concluidas")
      .select("consultor")
      .not("consultor", "is", null)
      .order("consultor")

    if (error) {
      console.error("Error fetching consultores:", error)
      throw error
    }

    // Filtrar valores únicos
    const consultores = [...new Set(data.map((item) => item.consultor))]
    return consultores.filter(Boolean) as string[]
  } catch (error) {
    console.error("Error in getCompletedConsultores:", error)
    return []
  }
}

// Buscar dados de comissões por consultor
export async function getConsultantCommissions(
  consultores: string[],
  startDate?: string,
  endDate?: string,
): Promise<{ consultor: string; totalComissao: number; projetosCount: number }[]> {
  try {
    if (!consultores.length) return []

    const supabase = getSupabase()
    let query = supabase
      .from("view_consultorias_concluidas")
      .select("consultor, valor_comissao")
      .in("consultor", consultores)
      .not("valor_comissao", "is", null)

    if (startDate) {
      query = query.gte("data_inicio", startDate)
    }
    if (endDate) {
      query = query.lte("data_termino", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching consultant commissions:", error)
      throw error
    }

    // Agrupar por consultor
    const commissionsByConsultant = consultores.map((consultor) => {
      const consultantProjects = data.filter((p) => p.consultor === consultor)
      const totalComissao = consultantProjects.reduce((sum, p) => sum + (p.valor_comissao || 0), 0)

      return {
        consultor,
        totalComissao,
        projetosCount: consultantProjects.length,
      }
    })

    return commissionsByConsultant
  } catch (error) {
    console.error("Error in getConsultantCommissions:", error)
    return []
  }
}
