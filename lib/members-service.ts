import { getSupabase } from "./supabase"
import type { Member, MetricEntry } from "./types"

// Buscar todos os membros
export async function getMembers(): Promise<Member[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("members")
      .select("id, name, email, role, joined_at, created_at, avatar_url, access_type, service_type")
      .order("name")

    if (error) {
      console.error("Error fetching members:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching members:", error)
    return []
  }
}

// Buscar todos os membros (alias para getMembers para compatibilidade)
export async function getAllMembers(): Promise<Member[]> {
  try {
    console.log("🔍 getAllMembers: Buscando todos os membros...")
    const members = await getMembers()
    console.log(`📋 getAllMembers: Encontrados ${members.length} membros:`, members)
    return members
  } catch (error) {
    console.error("❌ getAllMembers: Erro ao buscar membros:", error)
    return []
  }
}

// Buscar membro por ID
export async function getMemberById(id: string): Promise<Member | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("members")
      .select("id, name, email, role, joined_at, created_at, avatar_url, access_type, service_type")
      .eq("id", id)
      .single()

    if (error) {
      console.error(`Error fetching member with id ${id}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Unexpected error fetching member with id ${id}:`, error)
    return null
  }
}

// Criar um novo membro
export async function createMember(member: Omit<Member, "id" | "joined_at" | "created_at">): Promise<Member | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("members").insert([member]).select().single()

    if (error) {
      console.error("Error creating member:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error creating member:", error)
    return null
  }
}

// Atualizar um membro existente
export async function updateMember(
  id: string,
  member: Partial<Omit<Member, "id" | "joined_at" | "created_at">>,
): Promise<Member | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("members").update(member).eq("id", id).select().single()

    if (error) {
      console.error(`Error updating member with id ${id}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Unexpected error updating member with id ${id}:`, error)
    return null
  }
}

// Excluir um membro
export async function deleteMember(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from("members").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting member with id ${id}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Unexpected error deleting member with id ${id}:`, error)
    return false
  }
}

// Verificar se um email já está em uso
export async function isEmailInUse(email: string, excludeId?: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    let query = supabase.from("members").select("id").eq("email", email)

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error checking if email ${email} is in use:`, error)
      return false
    }

    return (data || []).length > 0
  } catch (error) {
    console.error(`Unexpected error checking if email ${email} is in use:`, error)
    return false
  }
}

// Buscar membros por função
export async function getMembersByRole(role: string): Promise<Member[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("members")
      .select("id, name, email, role, joined_at, created_at, avatar_url, access_type, service_type")
      .eq("role", role)
      .order("name")

    if (error) {
      console.error(`Error fetching members with role ${role}:`, error)
      return []
    }

    return data || []
  } catch (error) {
    console.error(`Unexpected error fetching members with role ${role}:`, error)
    return []
  }
}

// Buscar métricas de um membro específico
export async function getMemberMetrics(
  memberId: string,
  startDate?: string,
  endDate?: string,
  serviceType?: string,
): Promise<MetricEntry[]> {
  try {
    const supabase = getSupabase()
    let query = supabase.from("metrics").select("*").eq("member_id", memberId).order("date", { ascending: false })

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    if (serviceType) {
      query = query.eq("service_type", serviceType)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching metrics for member ${memberId}:`, error)
      return []
    }

    // Adicionar propriedades em camelCase para compatibilidade
    return (
      data?.map((metric) => ({
        ...metric,
        resolutionRate: metric.resolution_rate,
        averageResponseTime: metric.average_response_time,
        csatScore: metric.csat_score,
        evaluatedPercentage: metric.evaluated_percentage,
        openTickets: metric.open_tickets,
        resolvedTickets: metric.resolved_tickets,
      })) || []
    )
  } catch (error) {
    console.error(`Unexpected error fetching metrics for member ${memberId}:`, error)
    return []
  }
}

// Atualizar senha de um membro
export async function updateMemberPassword(id: string, password: string): Promise<boolean> {
  try {
    const supabase = getSupabase()
    // Nota: Em um sistema real, você deve hash a senha antes de armazená-la
    const { error } = await supabase.from("members").update({ password }).eq("id", id)

    if (error) {
      console.error(`Error updating password for member with id ${id}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Unexpected error updating password for member with id ${id}:`, error)
    return false
  }
}

// Buscar membros por tipo de serviço
export async function getMembersByService(serviceType: string): Promise<Member[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("members")
      .select("id, name, email, role, joined_at, created_at, avatar_url, access_type, service_type")
      .eq("service_type", serviceType)
      .order("name")

    if (error) {
      console.error(`Error fetching members with service type ${serviceType}:`, error)
      throw new Error(`Error fetching members with service type ${serviceType}: ${error.message}`)
    }

    console.log(`Found ${data?.length || 0} members with service_type=${serviceType}`)
    return data || []
  } catch (error) {
    console.error(`Unexpected error fetching members with service type ${serviceType}:`, error)
    throw error
  }
}
