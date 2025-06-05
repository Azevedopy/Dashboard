"use server"

import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key for admin access
function getAdminSupabase() {
  // Usar as variáveis de ambiente corretas com prefixo EXPO_PUBLIC_
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  // Usar a variável de ambiente sem o prefixo EXPO_PUBLIC_
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or Service Role Key is missing")
    throw new Error("Supabase URL or Service Role Key is missing")
  }

  // Log the first few characters of the keys for debugging (don't log the full key for security)
  console.log(`URL prefix: ${supabaseUrl.substring(0, 10)}...`)
  console.log(`Service key prefix: ${supabaseServiceKey.substring(0, 5)}...`)

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}

export async function addPublishedMaterial(materialName: string, metricIds: string[] | null) {
  try {
    // Use the admin client with service role key to bypass RLS
    const supabaseAdmin = getAdminSupabase()

    const { data, error } = await supabaseAdmin
      .from("published_materials")
      .insert([
        {
          material_name: materialName,
          original_metric_ids: metricIds,
          published_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("Error registering published material:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in addPublishedMaterial:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function restorePublishedMaterial(materialId: string) {
  try {
    // Use the admin client with service role key to bypass RLS
    const supabaseAdmin = getAdminSupabase()

    const { error } = await supabaseAdmin
      .from("published_materials")
      .update({ restored_at: new Date().toISOString() })
      .eq("id", materialId)

    if (error) {
      console.error("Error marking material as restored:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in restorePublishedMaterial:", error)
    return { success: false, error: "Internal server error" }
  }
}
