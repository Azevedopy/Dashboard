"use server"

import { getSupabase } from "@/lib/supabase"

export async function addPublishedMaterialDirect(materialName: string, metricIds: string[] | null) {
  try {
    // Use the regular client (will be subject to RLS but should work for authenticated users)
    const supabase = getSupabase()

    const { data, error } = await supabase
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
      console.error("Error adding published material directly:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in addPublishedMaterialDirect:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function restorePublishedMaterialDirect(materialId: string) {
  try {
    // Use the regular client (will be subject to RLS but should work for authenticated users)
    const supabase = getSupabase()

    const { error } = await supabase
      .from("published_materials")
      .update({ restored_at: new Date().toISOString() })
      .eq("id", materialId)

    if (error) {
      console.error("Error restoring published material directly:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in restorePublishedMaterialDirect:", error)
    return { success: false, error: "Internal server error" }
  }
}
