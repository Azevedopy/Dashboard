import { getSupabase } from "./supabase"
import type { DefaultPermission, Permission } from "./types"

// Buscar todas as permissões padrão
export async function getDefaultPermissions(): Promise<DefaultPermission[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("default_permissions").select("*").order("role_type")

    if (error) {
      console.error("Error fetching default permissions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error fetching default permissions:", error)
    return []
  }
}

// Buscar permissões padrão por tipo de função
export async function getDefaultPermissionByRole(roleType: string): Promise<DefaultPermission | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("default_permissions").select("*").eq("role_type", roleType).single()

    if (error) {
      console.error(`Error fetching default permissions for role ${roleType}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Unexpected error fetching default permissions for role ${roleType}:`, error)
    return null
  }
}

// Criar ou atualizar permissões padrão
export async function upsertDefaultPermission(
  permission: Omit<DefaultPermission, "created_at" | "updated_at">,
): Promise<DefaultPermission | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("default_permissions")
      .upsert(permission, { onConflict: "role_type" })
      .select()
      .single()

    if (error) {
      console.error("Error upserting default permission:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Unexpected error upserting default permission:", error)
    return null
  }
}

// Excluir permissões padrão
export async function deleteDefaultPermission(id: number): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from("default_permissions").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting default permission with id ${id}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Unexpected error deleting default permission with id ${id}:`, error)
    return false
  }
}

// Verificar se um usuário tem permissão para uma ação específica
export function hasPermission(permissions: Permission[], resource: string, action: string): boolean {
  const permission = permissions.find((p) => p.resource === resource)
  return permission ? permission.actions.includes(action) : false
}
