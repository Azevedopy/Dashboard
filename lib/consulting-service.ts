import { getSupabase } from "./supabase"
import type { ConsultingProject, ConsultingStats } from "./types"

// Buscar todos os projetos de consultoria
export async function getConsultingProjects(filters?: {
  status?: string
  consultor?: string
  startDate?: string
  endDate?: string
}): Promise<ConsultingProject[]> {
  try {
    const supabase = getSupabase()
    let query = supabase.from("metrics_consultoria").select("*")

    // Aplicar filtros se fornecidos
    if (filters) {
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
    }

    // Ordenar por data de início (mais recentes primeiro)
    query = query.order("data_inicio", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching consulting projects:", error)
      return []
    }

    console.log("Projetos recuperados do banco:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("Unexpected error fetching consulting projects:", error)
    return []
  }
}

// Obter estatísticas de consultoria
export async function getConsultingStats(filters?: {
  consultor?: string
  startDate?: string
  endDate?: string
}): Promise<ConsultingStats> {
  try {
    // Buscar todos os projetos para calcular estatísticas
    const allProjects = await getConsultingProjects(filters)

    if (!allProjects.length) {
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

    // Calcular estatísticas
    const activeProjects = allProjects.filter((p) => p.status === "em_andamento").length
    const completedProjects = allProjects.filter((p) => p.status === "concluido").length

    // Calcular média de avaliação (apenas para projetos com avaliação)
    const projectsWithRating = allProjects.filter(
      (p) => p.avaliacao_estrelas !== null && p.avaliacao_estrelas !== undefined,
    )
    const averageRating =
      projectsWithRating.length > 0
        ? projectsWithRating.reduce((sum, p) => sum + (p.avaliacao_estrelas || 0), 0) / projectsWithRating.length
        : 0

    // Calcular receita total
    const totalRevenue = allProjects.reduce((sum, p) => sum + p.valor_consultoria, 0)

    // Calcular duração média dos projetos
    const averageProjectDuration = allProjects.reduce((sum, p) => sum + p.tempo_dias, 0) / allProjects.length

    // Calcular taxa de cumprimento de prazo (apenas para projetos concluídos)
    const concludedProjects = allProjects.filter((p) => p.status === "concluido" && p.prazo_atingido !== undefined)
    const deadlineComplianceRate =
      concludedProjects.length > 0
        ? (concludedProjects.filter((p) => p.prazo_atingido).length / concludedProjects.length) * 100
        : 0

    return {
      totalProjects: allProjects.length,
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

// Obter lista de consultores únicos
export async function getConsultores(): Promise<string[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_consultoria").select("consultor").not("consultor", "is", null)

    if (error) {
      console.error("Error fetching consultores:", error)
      return []
    }

    // Extrair consultores únicos
    const consultores = [...new Set(data?.map((item) => item.consultor).filter(Boolean))]
    return consultores
  } catch (error) {
    console.error("Unexpected error fetching consultores:", error)
    return []
  }
}

// Function to get a consulting project by ID
export async function getConsultingProjectById(id: string): Promise<ConsultingProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_consultoria").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching consulting project by ID:", error)
      return null
    }

    return data || null
  } catch (error) {
    console.error("Unexpected error fetching consulting project by ID:", error)
    return null
  }
}

// Function to create a consulting project
export async function createConsultingProject(
  project: Omit<ConsultingProject, "id">,
): Promise<ConsultingProject | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("metrics_consultoria").insert([project]).select().single()

    if (error) {
      console.error("Error creating consulting project:", error)
      return null
    }

    return data || null
  } catch (error) {
    console.error("Unexpected error creating consulting project:", error)
    return null
  }
}

// Valores permitidos para o campo "tipo"
const ALLOWED_TIPOS = ["Consultoria", "Upsell", "consultoria", "upsell"]

// Função para atualizar um projeto de consultoria existente
export async function updateConsultingProject(project: Partial<ConsultingProject>): Promise<ConsultingProject> {
  try {
    // Log para verificar os campos disponíveis
    console.log("Campos a serem atualizados:", Object.keys(project))
    console.log("Valor do campo tipo:", project.tipo)

    // Verificar se o tipo é válido
    if (project.tipo && !ALLOWED_TIPOS.includes(project.tipo)) {
      console.error(`Tipo inválido: ${project.tipo}. Valores permitidos: ${ALLOWED_TIPOS.join(", ")}`)
      throw new Error(`Tipo inválido: ${project.tipo}. Valores permitidos: ${ALLOWED_TIPOS.join(", ")}`)
    }

    const supabase = getSupabase()

    // Preparar objeto de atualização apenas com campos que existem na tabela
    const updateData = {
      cliente: project.cliente,
      tipo: project.tipo,
      consultor: project.consultor,
      porte: project.porte,
      porte_detalhado: project.porte_detalhado,
      data_inicio: project.data_inicio,
      data_termino: project.data_termino,
      tempo_dias: project.tempo_dias,
      valor_consultoria: project.valor_consultoria,
      valor_bonus: project.valor_bonus,
      status: project.status,
      data_fechamento: project.data_fechamento,
      data_virada: project.data_virada,
      updated_at: new Date().toISOString(),
    }

    // Remover campos undefined para evitar erros
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    console.log("Dados finais para atualização:", updateData)

    const { data, error } = await supabase
      .from("metrics_consultoria")
      .update(updateData)
      .eq("id", project.id)
      .select()
      .single()

    if (error) {
      console.error("Erro detalhado ao atualizar projeto:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao atualizar projeto de consultoria:", error)
    throw error
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
