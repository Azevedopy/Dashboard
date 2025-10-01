import { createClient } from "@supabase/supabase-js"

// Usar as variáveis de ambiente corretas fornecidas pelo usuário
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wmisdbixxpzhhihujueb.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaXNkYml4eHB6aGhpaHVqdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMDE0MTksImV4cCI6MjA1ODg3NzQxOX0.V3NspT501soozWpzRPfOc8wyNTVRehan-pE0cmc6iTM"

// Criar o cliente Supabase principal (exportação nomeada necessária)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "x-client-info": "support-dashboard",
    },
  },
})

// Variável para armazenar a instância do cliente Supabase (singleton pattern)
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Função para criar um novo cliente Supabase (mantendo compatibilidade)
export function getSupabase() {
  // Verificar se estamos em ambiente que não suporta Supabase
  if (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("localhost"))
  ) {
    console.log("🔄 Ambiente de desenvolvimento/preview - usando dados mockados")
    return null
  }

  if (supabaseInstance) return supabaseInstance

  try {
    // Usar a instância já criada acima
    supabaseInstance = supabase
    console.log("✅ Cliente Supabase inicializado com sucesso")
    return supabaseInstance
  } catch (error) {
    console.error("❌ Erro ao inicializar cliente Supabase:", error)

    // Em ambiente de desenvolvimento/preview, retornar null para usar dados mockados
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Usando dados mockados para ambiente de preview")
      return null
    }

    return null
  }
}

// Função para testar a conexão
export async function testSupabaseConnection() {
  try {
    const client = getSupabase()
    if (!client) {
      return { success: false, error: "Cliente não inicializado" }
    }

    // Testar uma consulta simples com timeout
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))

    const queryPromise = client.from("members").select("count").limit(1)

    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// Função para resetar o cliente (útil para debugging)
export function resetSupabaseClient() {
  supabaseInstance = null
  console.log("🔄 Cliente Supabase resetado")
}

// Tipos TypeScript para compatibilidade
export type Member = {
  id: string
  name: string
  email: string
  role: string
  joined_at: string
  created_at: string
  avatar_url?: string
  access_type: string
  password?: string
  service_type?: string
}

export type MetricEntry = {
  id: string
  member_id: string
  date: string
  resolution_rate: number
  average_response_time: number
  csat_score: number
  evaluated_percentage: number
  open_tickets: number
  resolved_tickets: number
  service_type?: string
  member?: string
  // Propriedades em camelCase para compatibilidade
  resolutionRate?: number
  averageResponseTime?: number
  csatScore?: number
  evaluatedPercentage?: number
  openTickets?: number
  resolvedTickets?: number
  serviceType?: string
}

export type DailyMetric = {
  date: string
  resolution_rate: number
  average_response_time: number
  csat_score: number
  evaluated_percentage: number
  open_tickets: number
  resolved_tickets: number
}

export type MemberMetrics = {
  member: Member
  metrics: MetricEntry[]
}

export type ConsultingMetric = {
  id?: string
  client: string
  project_type: string
  consultor: string
  start_date: string
  end_date: string
  consulting_value: number
  bonus_8_percent: number
  bonus_12_percent: number
  porte: string
  member_id?: string
}
