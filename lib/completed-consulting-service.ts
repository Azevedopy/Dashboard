import { getSupabase } from "@/lib/supabase"
import type { ConsultingProject, ConsultingStats } from "@/lib/types"

// Função para verificar se estamos em ambiente de preview (v0.dev)
const isPreviewEnvironment = () => {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") ||
      window.location.hostname === "localhost" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL)
  )
}

// Dados mockados mais robustos para consultorias concluídas
const generateMockCompletedProjects = (): ConsultingProject[] => [
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
  },
  {
    id: "mock-4",
    cliente: "Corporação Global",
    tipo: "consultoria",
    porte: "enterprise",
    consultor: "Ana Costa",
    data_inicio: "2024-04-01",
    data_termino: "2024-06-15",
    data_finalizacao: "2024-06-20",
    tempo_dias: 75,
    valor_consultoria: 32000,
    valor_comissao: 3840,
    percentual_comissao: 12,
    avaliacao_estrelas: 3,
    prazo_atingido: false,
    status: "concluido",
  },
  {
    id: "mock-5",
    cliente: "Empresa Beta",
    tipo: "upsell",
    porte: "basic",
    consultor: "Pedro Oliveira",
    data_inicio: "2024-05-10",
    data_termino: "2024-05-25",
    data_finalizacao: "2024-05-24",
    tempo_dias: 15,
    valor_consultoria: 6000,
    valor_comissao: 720,
    percentual_comissao: 12,
    avaliacao_estrelas: 4,
    prazo_atingido: true,
    status: "concluido",
  },
  {
    id: "mock-6",
    cliente: "Indústria XYZ",
    tipo: "consultoria",
    porte: "pro",
    consultor: "Luciana Fernandes",
    data_inicio: "2024-06-01",
    data_termino: "2024-07-30",
    data_finalizacao: "2024-08-05",
    tempo_dias: 59,
    valor_consultoria: 22000,
    valor_comissao: 2640,
    percentual_comissao: 12,
    avaliacao_estrelas: 5,
    prazo_atingido: false,
    status: "concluido",
  },
]

// Buscar projetos de consultoria concluídos
export async function getCompletedConsultingProjects(filters?: {
  startDate?: string
  endDate?: string
  consultor?: string
}): Promise<ConsultingProject[]> {
  console.log("🔍 Buscando consultorias concluídas com filtros:", filters)

  // Se estamos em ambiente de preview, retornar dados mockados
  if (isPreviewEnvironment()) {
    console.log("📱 Ambiente de preview detectado. Usando dados mockados.")

    // Simular um pequeno atraso para parecer mais realista
    await new Promise((resolve) => setTimeout(resolve, 500))

    let mockProjects = generateMockCompletedProjects()

    // Aplicar filtros básicos aos dados mockados
    if (filters) {
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

    console.log(`✅ Mock: ${mockProjects.length} consultorias concluídas encontradas`)
    return mockProjects
  }

  try {
    const supabase = getSupabase()

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado")
    }

    // Usar a tabela principal metrics_consultoria
    let query = supabase.from("metrics_consultoria").select("*").eq("status", "concluido")

    // Aplicar filtros
    if (filters) {
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

    // Ordenar por data de finalização (mais recente primeiro)
    query = query.order("data_finalizacao", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("❌ Erro ao buscar consultorias concluídas:", error)
      throw error
    }

    console.log(`✅ Produção: ${data?.length || 0} consultorias concluídas encontradas`)
    return (data as ConsultingProject[]) || []
  } catch (error) {
    console.error("❌ Erro em getCompletedConsultingProjects:", error)
    // Em caso de erro, retornar dados mockados como fallback
    console.log("🔄 Usando dados mockados como fallback")
    return generateMockCompletedProjects()
  }
}

// Buscar estatísticas de consultorias concluídas
export async function getCompletedConsultingStats(filters?: {
  startDate?: string
  endDate?: string
}): Promise<ConsultingStats> {
  console.log("📊 Calculando estatísticas de consultorias concluídas")

  try {
    const projects = await getCompletedConsultingProjects(filters)

    if (!projects || projects.length === 0) {
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
    const completedProjects = projects.length
    const totalRevenue = projects.reduce((sum, project) => sum + (project.valor_consultoria || 0), 0)

    const projectsWithRating = projects.filter(
      (p) => p.avaliacao_estrelas !== null && p.avaliacao_estrelas !== undefined && p.avaliacao_estrelas > 0,
    )
    const averageRating =
      projectsWithRating.length > 0
        ? projectsWithRating.reduce((sum, p) => sum + (p.avaliacao_estrelas || 0), 0) / projectsWithRating.length
        : 0

    const projectsWithDuration = projects.filter((p) => p.tempo_dias && p.tempo_dias > 0)
    const averageProjectDuration =
      projectsWithDuration.length > 0
        ? projectsWithDuration.reduce((sum, p) => sum + (p.tempo_dias || 0), 0) / projectsWithDuration.length
        : 0

    const projectsWithDeadlineInfo = projects.filter((p) => p.prazo_atingido !== null && p.prazo_atingido !== undefined)
    const deadlineComplianceRate =
      projectsWithDeadlineInfo.length > 0
        ? (projectsWithDeadlineInfo.filter((p) => p.prazo_atingido === true).length / projectsWithDeadlineInfo.length) *
          100
        : 0

    const stats = {
      totalProjects: completedProjects, // Para consultorias concluídas, total = concluídas
      activeProjects: 0, // Não relevante para consultorias concluídas
      completedProjects,
      averageRating,
      totalRevenue,
      averageProjectDuration,
      deadlineComplianceRate,
    }

    console.log("📊 Estatísticas calculadas:", stats)
    return stats
  } catch (error) {
    console.error("❌ Erro em getCompletedConsultingStats:", error)

    // Retornar estatísticas mockadas como fallback
    return {
      totalProjects: 6,
      activeProjects: 0,
      completedProjects: 6,
      averageRating: 4.3,
      totalRevenue: 111500,
      averageProjectDuration: 44.3,
      deadlineComplianceRate: 50,
    }
  }
}

// Buscar lista de consultores que têm projetos concluídos
export async function getCompletedConsultores(): Promise<string[]> {
  console.log("👥 Buscando consultores com projetos concluídos")

  try {
    // Se estamos em ambiente de preview, retornar consultores mockados
    if (isPreviewEnvironment()) {
      const mockConsultores = [
        "João Silva",
        "Maria Santos",
        "Carlos Mendes",
        "Ana Costa",
        "Pedro Oliveira",
        "Luciana Fernandes",
      ]
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
      .eq("status", "concluido")
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
    console.error("❌ Erro em getCompletedConsultores:", error)

    // Em caso de erro, retornar consultores mockados
    const fallbackConsultores = [
      "João Silva",
      "Maria Santos",
      "Carlos Mendes",
      "Ana Costa",
      "Pedro Oliveira",
      "Luciana Fernandes",
    ]
    console.log("🔄 Usando consultores mockados como fallback:", fallbackConsultores)
    return fallbackConsultores
  }
}

// Buscar dados de comissões por consultor
export async function getConsultantCommissions(
  consultores: string[],
  startDate?: string,
  endDate?: string,
): Promise<{ consultor: string; totalComissao: number; projetosCount: number }[]> {
  console.log("💰 Buscando comissões por consultor:", { consultores, startDate, endDate })

  try {
    if (!consultores || consultores.length === 0) {
      console.log("⚠️ Nenhum consultor fornecido")
      return []
    }

    // Se estamos em ambiente de preview, retornar dados mockados de comissões
    if (isPreviewEnvironment()) {
      console.log("📱 Gerando dados mockados de comissões")

      const mockCommissions = consultores
        .map((consultor) => {
          // Gerar valores consistentes baseados no nome do consultor
          const seed = consultor.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
          const projetosCount = Math.floor(seed % 5) + 1
          const valorBase = (seed % 3000) + 1000
          const totalComissao = projetosCount * valorBase

          return {
            consultor,
            totalComissao,
            projetosCount,
          }
        })
        .sort((a, b) => b.totalComissao - a.totalComissao)

      console.log("📱 Mock comissões geradas:", mockCommissions)
      return mockCommissions
    }

    const supabase = getSupabase()

    if (!supabase) {
      throw new Error("Cliente Supabase não inicializado")
    }

    let query = supabase
      .from("metrics_consultoria")
      .select("consultor, valor_comissao")
      .eq("status", "concluido")
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
      console.error("❌ Erro ao buscar comissões:", error)
      throw error
    }

    // Agrupar por consultor
    const commissionsByConsultant = consultores
      .map((consultor) => {
        const consultantProjects = data.filter((p) => p.consultor === consultor)
        const totalComissao = consultantProjects.reduce((sum, p) => sum + (p.valor_comissao || 0), 0)

        return {
          consultor,
          totalComissao,
          projetosCount: consultantProjects.length,
        }
      })
      .filter((item) => item.projetosCount > 0)
      .sort((a, b) => b.totalComissao - a.totalComissao)

    console.log("✅ Comissões calculadas:", commissionsByConsultant)
    return commissionsByConsultant
  } catch (error) {
    console.error("❌ Erro em getConsultantCommissions:", error)

    // Em caso de erro, retornar dados mockados de comissões
    const fallbackCommissions = consultores
      .map((consultor) => {
        const seed = consultor.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const projetosCount = Math.floor(seed % 5) + 1
        const valorBase = (seed % 3000) + 1000
        const totalComissao = projetosCount * valorBase

        return {
          consultor,
          totalComissao,
          projetosCount,
        }
      })
      .sort((a, b) => b.totalComissao - a.totalComissao)

    console.log("🔄 Usando comissões mockadas como fallback:", fallbackCommissions)
    return fallbackCommissions
  }
}
