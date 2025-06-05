import { createClient } from "@supabase/supabase-js"

// Usar as variáveis de ambiente corretas fornecidas pelo usuário
const supabaseUrl = "https://wmisdbixxpzhhihujueb.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaXNkYml4eHB6aGhpaHVqdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMDE0MTksImV4cCI6MjA1ODg3NzQxOX0.V3NspT501soozWpzRPfOc8wyNTVRehan-pE0cmc6iTM"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função para criar um novo cliente Supabase (mantendo compatibilidade)
export function getSupabase() {
  return supabase
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
