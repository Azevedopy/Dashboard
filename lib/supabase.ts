import { createClient } from "@supabase/supabase-js"

// Usar as variáveis de ambiente corretas fornecidas pelo usuário
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wmisdbixxpzhhihujueb.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaXNkYml4eHB6aGhpaHVqdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMDE0MTksImV4cCI6MjA1ODg3NzQxOX0.V3NspT501soozWpzRPfOc8wyNTVRehan-pE0cmc6iTM"

// Criar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Variável para armazenar a instância do cliente Supabase (singleton pattern)
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Função para criar um novo cliente Supabase (mantendo compatibilidade)
export function getSupabase() {
  if (supabaseInstance) return supabaseInstance

  try {
    // Usar a instância já criada acima
    supabaseInstance = supabase
    return supabaseInstance
  } catch (error) {
    console.error("❌ Erro ao inicializar cliente Supabase:", error)

    // Em ambiente de desenvolvimento/preview, criar um cliente mock
    if (typeof window !== "undefined" && window.location.hostname.includes("v0.dev")) {
      console.log("🔄 Criando cliente Supabase mock para ambiente de preview")
      return createMockSupabaseClient()
    }

    return null
  }
}

// Cliente mock para ambiente de preview
function createMockSupabaseClient() {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => ({ data: null, error: null }),
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            then: async () => ({ data: [], error: null }),
          }),
          in: (column: string, values: any[]) => ({
            order: (column: string, { ascending }: { ascending: boolean }) => ({
              then: async () => ({ data: [], error: null }),
            }),
          }),
        }),
        order: (column: string, { ascending }: { ascending: boolean }) => ({
          then: async () => ({ data: [], error: null }),
        }),
        gte: (column: string, value: any) => ({
          lte: (column: string, value: any) => ({
            eq: (column: string, value: any) => ({
              order: (column: string, { ascending }: { ascending: boolean }) => ({
                then: async () => ({ data: [], error: null }),
              }),
              order: (column: string, { ascending }: { ascending: boolean }) => ({
                then: async () => ({ data: [], error: null }),
              }),
            }),
            order: (column: string, { ascending }: { ascending: boolean }) => ({
              then: async () => ({ data: [], error: null }),
            }),
          }),
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            then: async () => ({ data: [], error: null }),
          }),
        }),
        lte: (column: string, value: any) => ({
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            then: async () => ({ data: [], error: null }),
          }),
        }),
        ilike: (column: string, value: any) => ({
          then: async () => ({ data: [], error: null }),
        }),
        in: (column: string, values: any[]) => ({
          order: (column: string, { ascending }: { ascending: boolean }) => ({
            then: async () => ({ data: [], error: null }),
          }),
        }),
        then: async () => ({ data: [], error: null }),
      }),
      insert: (data: any[]) => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
          then: async () => ({ data: [], error: null }),
        }),
        then: async () => ({ data: null, error: null }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
          then: async () => ({ data: null, error: null }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          then: async () => ({ error: null }),
        }),
      }),
    }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
    },
  }
}

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
