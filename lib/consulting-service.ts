import { getSupabase } from "@/lib/supabase"
import type { ConsultingProject, ConsultingStats, ConsultingMetric } from "@/lib/types"

// Função para verificar se estamos em ambiente de preview (v0.dev)
const isPreviewEnvironment = () => {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") ||
      window.location.hostname === "localhost" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL)
  )
}

// Dados mockados para ambiente de preview
const generateMockProjects = (): ConsultingProject[] => [
  {
    id: "mock-1",
    cliente: "Empresa Alpha Ltda",
    tipo: "consultoria",
    porte: "enterprise",
    consultor: "João Silva",
    data_inicio: "2024-01-15",
    data_termino: "2024-03-10",
    data_finalizacao: "2024-03-12",
    tempo_dias: 55,
    valor_consultoria: 25000,
    valor_comissao: 3000,
    percentual_comissao: 12,
    avaliacao_estrelas: 5,
    prazo_atingido: true,
    status: "concluido",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "mock-2",
    cliente: "Tech Solutions Inc",
    tipo: "upsell",
    porte: "pro",
    consultor: "Maria Santos",
    data_inicio: "2024-02-01",
    data_termino: "2024-03-15",
    data_finalizacao: "2024-03-20",
    tempo_dias: 43,
    valor_consultoria: 18000,
    valor_comissao: 2160,
    percentual_comissao: 12,
    avaliacao_estrelas: 4,
    prazo_atingido: false,
    status: "concluido",
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-02-01T09:00:00Z",
  },
  {
    id: "mock-3",
    cliente: "Startup Inovadora",
    tipo: "consultoria",
    porte: "starter",
    consultor: "Carlos Mendes",
    data_inicio: "2024-03-01",
    data_termino: "2024-03-20",
    data_finalizacao: "2024-03-18",
    tempo_dias: 19,
    valor_consultoria: 8500,
    valor_comissao: 1020,
    percentual_comissao: 12,
    avaliacao_estrelas: 5,
    prazo_atingido: true,
    status: "concluido",
    created_at: "2024-03-01T08:00:00Z",
    updated_at: "2024-03-01T08:00:00Z",
  },
  {
    id: "896f72e8-67d8-4953-910f-80d36c4dbbc0",
    cliente: "Empresa Exemplo Ltda",
    tipo: "consultoria",
    porte: "pro",
    consultor: "João Silva",
    data_inicio: "2024-01-15",
    data_termino: "2024-03-10",
    data_fechamento: "2024-01-10",
    data_virada: "2024-02-15",
    tempo_dias: 55,
    valor_consultoria: 25000,
    valor_comissao: 3000,
    percentual_comissao: 12,
    status: "em_andamento",
    prazo_atingido: null,
    avaliacao_estrelas: null,
    nota_consultoria: null,
    data_finalizacao: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
]

// Buscar projetos de consultoria
export async function getConsultingProjects(filters?: {
  status?: string
  startDate?: string
  endDate?: string
  consultor?: string
}): Promise<ConsultingProject[]> {
  console.log("🔍 Buscando projetos de consultoria com filtros:", filters)

  // Se estamos em ambiente de preview, retornar dados mockados
  if (isPreviewEnvironment()) {
    console.log("📱 Ambiente de preview detectado. Usando dados mockados.")

    // Simular um pequeno atraso para parecer mais realista
    await new Promise((resolve) => setTimeout(resolve, 500))

    let mockProjects = generateMockProjects()

    // Aplicar filtros básicos aos dados mockados
    if (filters) {
      if (filters.status) {
        mockProjects = mockProjects.filter((p) => p.status === filters.status)
      }

      if (filters.consultor && filters.consultor !== "todos") {
        mockProjects = mockProjects.filter((p) => p.consultor === filters.consultor)
      }

      if (filters.startDate) {
        mockProjects = mockProjects.filter((p) => p.data_inicio >= filters.startDate!)
      }

      if (filters.endDate) {
        mockProjects = mockProjects.filter((p) => p.data_termino <= filters.endDate!)
      }
    }

    console.log(`✅ Mock: ${mockProjects.length} projetos encontrados`)
    return mockProjects
  }

  try {
    const supabase = getSupabase()

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado")
    }

    // Usar a tabela correta: metrics_consultoria
    let query = supabase.from("metrics_consultoria").select("*")

    // Aplicar filtros
    if (filters) {
      if (filters.status) {
        query = query.eq("status", filters.status)
      }
      if (filters.startDate) {
        query = query.gte("data_inicio", filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte("data_termino", filters.endDate)
      }
      if (filters.consultor && filters.consultor !== "todos") {
        query = query.eq("consultor", filters.consultor)
      }
    }

    // Ordenar por data de início (mais recente primeiro)
    query = query.order("data_inicio", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("❌ Erro ao buscar projetos de consultoria:", error)
      throw error
    }

    console.log(`✅ Produção: ${data?.length || 0} projetos encontrados`)
    return (data as ConsultingProject[]) || []
  } catch (error) {
    console.error("❌ Erro em getConsultingProjects:", error)
    // Em caso de erro, retornar dados mockados como fallback
    console.log("🔄 Usando dados mockados como fallback")
    return generateMockProjects()
  }
}

// Buscar estatísticas de consultoria
export async function getConsultingStats(filters?: {
  startDate?: string
  endDate?: string
}): Promise<ConsultingStats> {
  console.log("📊 Calculando estatísticas de consultoria")

  try {
    const allProjects = await getConsultingProjects(filters)
    const activeProjects = allProjects.filter((p) => p.status === "em_andamento")
    const completedProjects = allProjects.filter((p) => p.status === "concluido")

    if (!allProjects || allProjects.length === 0) {
      console.log("📊 Nenhum projeto encontrado, retornando estatísticas vazias")
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
    const totalRevenue = allProjects.reduce((sum, project) => sum + (Number(project.valor_consultoria) || 0), 0)

    const projectsWithRating = completedProjects.filter(
      (p) => p.avaliacao_estrelas !== null && p.avaliacao_estrelas !== undefined && p.avaliacao_estrelas > 0,
    )
    const averageRating =
      projectsWithRating.length > 0
        ? projectsWithRating.reduce((sum, p) => sum + (p.avaliacao_estrelas || 0), 0) / projectsWithRating.length
        : 0

    const projectsWithDuration = allProjects.filter((p) => p.tempo_dias && p.tempo_dias > 0)
    const averageProjectDuration =
      projectsWithDuration.length > 0
        ? projectsWithDuration.reduce((sum, p) => sum + (p.tempo_dias || 0), 0) / projectsWithDuration.length
        : 0

    const projectsWithDeadlineInfo = completedProjects.filter(
      (p) => p.prazo_atingido !== null && p.prazo_atingido !== undefined,
    )
    const deadlineComplianceRate =
      projectsWithDeadlineInfo.length > 0
        ? (projectsWithDeadlineInfo.filter((p) => p.prazo_atingido === true).length / projectsWithDeadlineInfo.length) *
          100
        : 0

    const stats = {
      totalProjects: allProjects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      averageRating,
      totalRevenue,
      averageProjectDuration,
      deadlineComplianceRate,
    }

    console.log("📊 Estatísticas calculadas:", stats)
    return stats
  } catch (error) {
    console.error("❌ Erro em getConsultingStats:", error)

    // Retornar estatísticas mockadas como fallback
    return {
      totalProjects: 2,
      activeProjects: 2,
      completedProjects: 0,
      averageRating: 0,
      totalRevenue: 43000,
      averageProjectDuration: 49,
      deadlineComplianceRate: 0,
    }
  }
}

// Buscar lista de consultores
export async function getConsultores(): Promise<string[]> {
  console.log("👥 Buscando consultores")

  try {
    // Se estamos em ambiente de preview, retornar consultores mockados
    if (isPreviewEnvironment()) {
      const mockConsultores = ["João Silva", "Maria Santos", "Carlos Mendes", "Ana Costa"]
      console.log("📱 Mock: Consultores encontrados:", mockConsultores)
      return mockConsultores
    }

    const supabase = getSupabase()

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado")
    }

    const { data, error } = await supabase
      .from("metrics_consultoria")
      .select("consultor")
      .not("consultor", "is", null)
      .order("consultor")

    if (error) {
      console.error("❌ Erro ao buscar consultores:", error)
      throw error
    }

    // Filtrar valores únicos
    const consultores = [...new Set(data.map((item) => item.consultor).filter(Boolean))] as string[]
    console.log("✅ Consultores encontrados:", consultores)
    return consultores
  } catch (error) {
    console.error("❌ Erro em getConsultores:", error)

    // Em caso de erro, retornar consultores mockados
    const fallbackConsultores = ["João Silva", "Maria Santos", "Carlos Mendes", "Ana Costa"]
    console.log("🔄 Usando consultores mockados como fallback:", fallbackConsultores)
    return fallbackConsultores
  }
}

// Criar novo projeto de consultoria
export async function createConsultingProject(projectData: Partial<ConsultingProject>): Promise<ConsultingProject> {
  console.log("➕ Criando novo projeto de consultoria:", projectData)

  // Se estamos em ambiente de preview, simular criação
  if (isPreviewEnvironment()) {
    console.log("📱 Simulando criação em ambiente de preview")

    const mockProject: ConsultingProject = {
      id: `mock-${Date.now()}`,
      cliente: projectData.cliente || "",
      tipo: projectData.tipo || "consultoria",
      porte: projectData.porte || "basic",
      consultor: projectData.consultor || "",
      data_inicio: projectData.data_inicio || new Date().toISOString().split("T")[0],
      data_termino: projectData.data_termino || new Date().toISOString().split("T")[0],
      tempo_dias: projectData.tempo_dias || 0,
      valor_consultoria: projectData.valor_consultoria || 0,
      valor_comissao: projectData.valor_comissao || 0,
      percentual_comissao: projectData.percentual_comissao || 0,
      status: projectData.status || "em_andamento",
      prazo_atingido: projectData.prazo_atingido || null,
      avaliacao_estrelas: projectData.avaliacao_estrelas || null,
      nota_consultoria: projectData.nota_consultoria || null,
      data_finalizacao: projectData.data_finalizacao || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Simular delay de criação
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("✅ Mock: Projeto criado com sucesso:", mockProject)
    return mockProject
  }

  try {
    const supabase = getSupabase()

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado")
    }

    // Preparar dados para inserção
    const insertData = {
      cliente: projectData.cliente,
      tipo: projectData.tipo,
      porte: projectData.porte,
      consultor: projectData.consultor,
      data_inicio: projectData.data_inicio,
      data_termino: projectData.data_termino,
      tempo_dias: Number(projectData.tempo_dias) || 0,
      valor_consultoria: Number(projectData.valor_consultoria) || 0,
      valor_comissao: Number(projectData.valor_comissao) || 0,
      percentual_comissao: Number(projectData.percentual_comissao) || 0,
      status: projectData.status || "em_andamento",
      prazo_atingido: projectData.prazo_atingido,
      avaliacao_estrelas: projectData.avaliacao_estrelas ? Number(projectData.avaliacao_estrelas) : null,
      nota_consultoria: projectData.nota_consultoria || null,
      data_finalizacao: projectData.data_finalizacao || null,
    }

    console.log("📝 Dados preparados para inserção:", insertData)

    const { data, error } = await supabase.from("metrics_consultoria").insert([insertData]).select().single()

    if (error) {
      console.error("❌ Erro ao criar projeto de consultoria:", error)
      throw error
    }

    console.log("✅ Projeto de consultoria criado com sucesso:", data)
    return data as ConsultingProject
  } catch (error) {
    console.error("❌ Erro em createConsultingProject:", error)
    throw error
  }
}

// Atualizar projeto de consultoria
export async function updateConsultingProject(
  updateData: Partial<ConsultingProject> & { id: string },
): Promise<ConsultingProject | null> {
  console.log("✏️ Atualizando projeto de consultoria:", updateData)

  const { id, ...projectData } = updateData

  if (!id) {
    console.error("❌ ID do projeto é obrigatório para atualização")
    throw new Error("ID do projeto é obrigatório")
  }

  // Se estamos em ambiente de preview, simular atualização
  if (isPreviewEnvironment()) {
    console.log("📱 Simulando atualização em ambiente de preview")

    const mockProject: ConsultingProject = {
      id,
      cliente: projectData.cliente || "Cliente Mock",
      tipo: projectData.tipo || "consultoria",
      porte: projectData.porte || "basic",
      consultor: projectData.consultor || "Consultor Mock",
      data_inicio: projectData.data_inicio || new Date().toISOString().split("T")[0],
      data_termino: projectData.data_termino || new Date().toISOString().split("T")[0],
      tempo_dias: projectData.tempo_dias || 0,
      valor_consultoria: projectData.valor_consultoria || 0,
      valor_comissao: projectData.valor_comissao || 0,
      percentual_comissao: projectData.percentual_comissao || 0,
      status: projectData.status || "em_andamento",
      prazo_atingido: projectData.prazo_atingido || null,
      avaliacao_estrelas: projectData.avaliacao_estrelas || null,
      nota_consultoria: projectData.nota_consultoria || null,
      data_finalizacao: projectData.data_finalizacao || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Simular delay de atualização
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("✅ Mock: Projeto atualizado com sucesso:", mockProject)
    return mockProject
  }

  try {
    const supabase = getSupabase()

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado")
    }

    // Preparar dados para atualização - remover campos undefined
    const cleanUpdateData: any = {}

    Object.keys(projectData).forEach((key) => {
      const value = projectData[key as keyof typeof projectData]
      if (value !== undefined) {
        // Converter campos numéricos
        if (
          ["tempo_dias", "valor_consultoria", "valor_comissao", "percentual_comissao", "avaliacao_estrelas"].includes(
            key,
          )
        ) {
          cleanUpdateData[key] = Number(value) || 0
        } else {
          cleanUpdateData[key] = value
        }
      }
    })

    console.log("📝 Dados limpos para atualização:", cleanUpdateData)

    const { data, error } = await supabase
      .from("metrics_consultoria")
      .update(cleanUpdateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Erro ao atualizar projeto de consultoria:", error)
      throw error
    }

    console.log("✅ Projeto de consultoria atualizado com sucesso:", data)
    return data as ConsultingProject
  } catch (error) {
    console.error("❌ Erro em updateConsultingProject:", error)
    throw error
  }
}

// Buscar projeto de consultoria por ID
export async function getConsultingProjectById(id: string): Promise<ConsultingProject | null> {
  console.log("🔍 Buscando projeto de consultoria por ID:", id)

  // Se estamos em ambiente de preview, retornar dados mockados
  if (isPreviewEnvironment()) {
    console.log("📱 Retornando dados mockados para preview")

    // Buscar nos dados mockados primeiro
    const mockProjects = generateMockProjects()
    const foundProject = mockProjects.find((p) => p.id === id)

    if (foundProject) {
      console.log("✅ Mock: Projeto encontrado nos dados mockados:", foundProject)
      return foundProject
    }

    // Se não encontrou, retornar um projeto genérico
    const mockProject: ConsultingProject = {
      id,
      cliente: "Empresa Exemplo Ltda",
      tipo: "consultoria",
      porte: "pro",
      consultor: "João Silva",
      data_inicio: "2024-01-15",
      data_termino: "2024-03-10",
      data_fechamento: "2024-01-10",
      data_virada: "2024-02-15",
      tempo_dias: 55,
      valor_consultoria: 25000,
      valor_comissao: 3000,
      percentual_comissao: 12,
      status: "em_andamento",
      prazo_atingido: null,
      avaliacao_estrelas: null,
      nota_consultoria: null,
      data_finalizacao: null,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
    }

    console.log("✅ Mock: Projeto genérico retornado:", mockProject)
    return mockProject
  }

  try {
    const supabase = getSupabase()

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado")
    }

    const { data, error } = await supabase.from("metrics_consultoria").select("*").eq("id", id).single()

    if (error) {
      console.error("❌ Erro ao buscar projeto por ID:", error)
      return null
    }

    console.log("✅ Projeto encontrado:", data)
    return data as ConsultingProject
  } catch (error) {
    console.error("❌ Erro em getConsultingProjectById:", error)
    return null
  }
}

// Deletar projeto de consultoria - FUNÇÃO ADICIONADA
export async function deleteConsultingProject(id: string): Promise<{ success: boolean; error?: string }> {
  console.log("🗑️ Deletando projeto de consultoria:", id)

  if (!id) {
    console.error("❌ ID do projeto é obrigatório para exclusão")
    return { success: false, error: "ID do projeto é obrigatório" }
  }

  // Se estamos em ambiente de preview, simular exclusão
  if (isPreviewEnvironment()) {
    console.log("📱 Simulando exclusão em ambiente de preview")

    // Simular delay de exclusão
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("✅ Mock: Projeto deletado com sucesso")
    return { success: true }
  }

  try {
    const supabase = getSupabase()

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado")
    }

    // Verificar se o projeto existe antes de deletar
    const { data: existingProject, error: fetchError } = await supabase
      .from("metrics_consultoria")
      .select("id")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        console.log("⚠️ Projeto não encontrado para exclusão:", id)
        return { success: false, error: "Projeto não encontrado" }
      }
      console.error("❌ Erro ao verificar projeto para exclusão:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // Deletar o projeto
    const { error: deleteError } = await supabase.from("metrics_consultoria").delete().eq("id", id)

    if (deleteError) {
      console.error("❌ Erro ao deletar projeto de consultoria:", deleteError)
      return { success: false, error: deleteError.message }
    }

    console.log("✅ Projeto de consultoria deletado com sucesso:", id)
    return { success: true }
  } catch (error) {
    console.error("❌ Erro inesperado ao deletar projeto de consultoria:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao deletar projeto de consultoria",
    }
  }
}

// Criar métrica de consultoria
export async function createConsultingMetric(metric: ConsultingMetric): Promise<{ success: boolean; error?: string }> {
  console.log("📊 Criando métrica de consultoria:", metric)

  try {
    // Se estamos em ambiente de preview, simular criação
    if (isPreviewEnvironment()) {
      console.log("📱 Simulando criação de métrica em ambiente de preview")

      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("✅ Mock: Métrica criada com sucesso")
      return { success: true }
    }

    const supabase = getSupabase()

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado")
    }

    // Mapeando os campos da métrica para o formato esperado pela tabela metrics_consultoria
    const projectData = {
      cliente: metric.client,
      tipo: metric.project_type,
      consultor: metric.consultor,
      data_inicio: metric.start_date,
      data_termino: metric.end_date,
      tempo_dias: Number(metric.duration) || 0,
      porte: metric.size,
      porte_detalhado: metric.size_detail || null,
      data_fechamento: metric.closing_date || null,
      data_virada: metric.turning_date || null,
      valor_consultoria: Number(metric.consulting_value) || 0,
      valor_bonus: Number(metric.bonus_8_percent) || 0,
      valor_bonus_12: Number(metric.bonus_12_percent) || 0,
      status: metric.status,
      valor_liquido_projeto: metric.valor_liquido_projeto ? Number(metric.valor_liquido_projeto) : null,
      // Campos de avaliação se fornecidos
      avaliacao_estrelas: metric.avaliacao_estrelas ? Number(metric.avaliacao_estrelas) : null,
      nota_consultoria: metric.nota_consultoria || null,
      data_finalizacao: metric.data_finalizacao || null,
      prazo_atingido: metric.prazo_atingido !== undefined ? metric.prazo_atingido : null,
      valor_comissao: metric.valor_comissao ? Number(metric.valor_comissao) : null,
      percentual_comissao: metric.percentual_comissao ? Number(metric.percentual_comissao) : null,
    }

    console.log("📝 Dados preparados para inserção:", projectData)

    const { data, error } = await supabase.from("metrics_consultoria").insert([projectData]).select().single()

    if (error) {
      console.error("❌ Erro ao criar métrica de consultoria:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Métrica de consultoria criada com sucesso:", data)
    return { success: true }
  } catch (error) {
    console.error("❌ Erro inesperado ao criar métrica de consultoria:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao criar métrica de consultoria",
    }
  }
}
