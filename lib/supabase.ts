import { createClient } from "@supabase/supabase-js"

// Função para criar um novo cliente Supabase
export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing")
    throw new Error("Supabase URL or Anon Key is missing")
  }

  // Criar uma nova instância do cliente Supabase a cada chamada
  // para evitar problemas de cache do esquema
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Desativar persistência de sessão para evitar problemas de cache
    },
    db: {
      schema: "public", // Especificar o esquema explicitamente
    },
  })
}

// Exportar uma instância para uso geral
export const supabase = getSupabase()

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
}
