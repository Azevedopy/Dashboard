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

    // Verificar se estamos em ambiente de preview
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Retornando dados mockados para ambiente de preview")
      return getMockConsultingProjects()
    }

    console.log("Buscando projetos com filtros:", filters) // Log para debug

    let query = supabase.from("metrics_consultoria").select("*")

    if (filters.status) {
      console.log(`Filtrando por status: ${filters.status}`) // Log para debug
      query = query.eq("status", filters.status)
    }

    if (filters.consultor && filters.consultor !== "todos") {
      query = query.eq("consultor", filters.consultor)
    }

    // Aplicar filtros de data apenas se fornecidos
    if (filters.startDate) {
      console.log(`Filtrando por data início >= ${filters.startDate}`) // Log para debug
      query = query.gte("data_inicio", filters.startDate)
    }

    if (filters.endDate) {
      console.log(`Filtrando por data término <= ${filters.endDate}`) // Log para debug
      query = query.lte("data_termino", filters.endDate)
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching consulting projects:", error)
      return getMockConsultingProjects()
    }

    console.log(`Encontrados ${data?.length || 0} projetos`) // Log para debug
    console.log("Primeiros 3 projetos:", data?.slice(0, 3)) // Log para debug
    return data || []
  } catch (error) {
    console.error("Unexpected error fetching consulting projects:", error)
    return getMockConsultingProjects()
  }
}

// Function to fetch a consulting project by ID
export async function getConsultingProjectById(id: string): Promise<ConsultingProject | null> {
  try {
    const supabase = getSupabase()

    // Verificar se estamos em ambiente de preview
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Retornando dados mockados para ambiente de preview")
      const mockProjects = getMockConsultingProjects()
      return mockProjects.find((p) => p.id === id) || mockProjects[0]
    }

    console.log(`Buscando projeto com ID: ${id}`) // Log para debug

    const { data, error } = await supabase.from("metrics_consultoria").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching consulting project:", error)
      return null
    }

    console.log("Projeto encontrado:", data) // Log para debug
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

    // Verificar se estamos em ambiente de preview
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Simulando criação de projeto em ambiente de preview")
      return {
        id: "mock-" + Date.now(),
        ...project,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    // Garantir que o status seja definido como "em_andamento" se não for fornecido
    const projectData = {
      ...project,
      status: project.status || "em_andamento",
      // Garantir que campos numéricos sejam números
      valor_consultoria: Number(project.valor_consultoria),
      valor_bonus: Number(project.valor_bonus),
      tempo_dias: Number(project.tempo_dias),
    }

    console.log("Criando projeto com dados:", projectData) // Log para debug

    const { data, error } = await supabase.from("metrics_consultoria").insert([projectData]).select().single()

    if (error) {
      console.error("Error creating consulting project:", error)
      return null
    }

    console.log("Projeto criado com sucesso:", data) // Log para debug
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

    console.log("Atualizando projeto de consultoria:", project)

    // Verificar se estamos em ambiente de preview
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Simulando atualização de projeto em ambiente de preview")
      return {
        ...project,
        updated_at: new Date().toISOString(),
      } as ConsultingProject
    }

    // Garantir que campos numéricos sejam números
    const projectData = { ...project }
    if (projectData.valor_consultoria !== undefined) {
      projectData.valor_consultoria = Number(projectData.valor_consultoria)
    }
    if (projectData.valor_bonus !== undefined) {
      projectData.valor_bonus = Number(projectData.valor_bonus)
    }
    if (projectData.tempo_dias !== undefined) {
      projectData.tempo_dias = Number(projectData.tempo_dias)
    }

    const { data, error } = await supabase
      .from("metrics_consultoria")
      .update(projectData)
      .eq("id", project.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating consulting project:", error)
      return null
    }

    console.log("Projeto atualizado com sucesso:", data)
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

    // Verificar se estamos em ambiente de preview
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Simulando exclusão de projeto em ambiente de preview")
      return true
    }

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
    // Verificar se estamos em ambiente de preview
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Retornando estatísticas mockadas para ambiente de preview")
      return getMockConsultingStats()
    }

    const projects = await getConsultingProjects(filters)

    const totalProjects = projects.length
    const activeProjects = projects.filter((project) => project.status === "em_andamento").length
    const completedProjects = projects.filter((project) => project.status === "concluido").length

    let totalRating = 0
    let validRatingCount = 0
    projects.forEach((project) => {
      if (project.avaliacao_estrelas) {
        // Usar o nome correto do campo
        totalRating += Number(project.avaliacao_estrelas)
        validRatingCount++
      }
    })
    const averageRating = validRatingCount > 0 ? totalRating / validRatingCount : 0

    let totalRevenue = 0
    projects.forEach((project) => {
      totalRevenue += Number(project.valor_consultoria) || 0 // Usar o nome correto do campo
    })

    let totalDuration = 0
    projects.forEach((project) => {
      totalDuration += Number(project.tempo_dias) || 0 // Usar o nome correto do campo
    })
    const averageProjectDuration = totalProjects > 0 ? totalDuration / totalProjects : 0

    let deadlineComplianceCount = 0
    projects.forEach((project) => {
      if (project.prazo_atingido) {
        // Usar o nome correto do campo
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
    return getMockConsultingStats()
  }
}

// Function to get unique consultant names
export async function getConsultores(): Promise<string[]> {
  try {
    console.log("🔍 Buscando consultores...")

    // Verificar se estamos em ambiente de preview
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Retornando consultores mockados para ambiente de preview")
      return ["Ana Silva", "Carlos Oliveira", "Mariana Santos", "Pedro Costa", "Juliana Lima"]
    }

    const supabase = getSupabase()

    // Buscar todos os consultores únicos da tabela metrics_consultoria
    const { data, error } = await supabase
      .from("metrics_consultoria")
      .select("consultor") // Usar o nome correto do campo
      .not("consultor", "is", null)
      .order("consultor")

    if (error) {
      console.error("❌ Erro ao buscar consultores:", error)
      return ["Ana Silva", "Carlos Oliveira", "Mariana Santos", "Pedro Costa", "Juliana Lima"]
    }

    console.log("📊 Dados brutos de consultores:", data)

    // Extrair nomes únicos de consultores
    const consultores = [...new Set(data.map((item) => item.consultor))]
      .filter(Boolean) // Remove valores null, undefined ou vazios
      .sort() // Ordena alfabeticamente

    console.log("✅ Consultores únicos encontrados:", consultores)
    return consultores
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar consultores:", error)
    return ["Ana Silva", "Carlos Oliveira", "Mariana Santos", "Pedro Costa", "Juliana Lima"]
  }
}

// Nova função para criar métricas de consultoria
export async function createConsultingMetric(metric: ConsultingMetric): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Criando métrica de consultoria:", metric)

    // Verificar se estamos em ambiente de preview
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Simulando criação de métrica em ambiente de preview")
      return { success: true }
    }

    const supabase = getSupabase()

    // Mapeando os campos da métrica para o formato esperado pela tabela metrics_consultoria
    const projectData = {
      cliente: metric.client,
      tipo: metric.project_type,
      consultor: metric.consultor,
      data_inicio: metric.start_date,
      data_termino: metric.end_date,
      tempo_dias: Number(metric.duration),
      porte: metric.size,
      porte_detalhado: metric.size_detail,
      data_fechamento: metric.closing_date,
      data_virada: metric.turning_date,
      valor_consultoria: Number(metric.consulting_value),
      valor_bonus: Number(metric.bonus_8_percent),
      valor_bonus_12: Number(metric.bonus_12_percent),
      status: metric.status,
      valor_liquido_projeto: metric.valor_liquido_projeto ? Number(metric.valor_liquido_projeto) : null,
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

// Função para gerar projetos de consultoria mockados
function getMockConsultingProjects(): ConsultingProject[] {
  return [
    {
      id: "mock-1",
      cliente: "Empresa ABC",
      tipo: "Implementação",
      consultor: "Ana Silva",
      data_inicio: "2024-05-01",
      data_termino: "2024-06-15",
      tempo_dias: 45,
      porte: "pro",
      valor_consultoria: 15000,
      valor_bonus: 0,
      status: "em_andamento",
      created_at: "2024-05-01T10:00:00Z",
      updated_at: "2024-05-01T10:00:00Z",
    },
    {
      id: "mock-2",
      cliente: "Startup XYZ",
      tipo: "Consultoria",
      consultor: "Carlos Oliveira",
      data_inicio: "2024-04-15",
      data_termino: "2024-05-15",
      tempo_dias: 30,
      porte: "starter",
      valor_consultoria: 8000,
      valor_bonus: 0,
      status: "concluido",
      avaliacao_estrelas: 5,
      prazo_atingido: true,
      created_at: "2024-04-15T09:30:00Z",
      updated_at: "2024-05-15T16:45:00Z",
    },
  ]
}

// Função para gerar estatísticas de consultoria mockadas
function getMockConsultingStats(): ConsultingStats {
  return {
    totalProjects: 2,
    activeProjects: 1,
    completedProjects: 1,
    averageRating: 5,
    totalRevenue: 23000,
    averageProjectDuration: 37.5,
    deadlineComplianceRate: 100,
  }
}
