import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client with the service role key for admin access
function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Usar a variável de ambiente sem o prefixo NEXT_PUBLIC_
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

export async function POST(request: Request) {
  try {
    const { action, materialName, metricIds, materialId } = await request.json()

    // Use the admin client with service role key to bypass RLS
    const supabaseAdmin = getAdminSupabase()

    if (action === "add") {
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
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    } else if (action === "restore") {
      const { error } = await supabaseAdmin
        .from("published_materials")
        .update({ restored_at: new Date().toISOString() })
        .eq("id", materialId)

      if (error) {
        console.error("Error marking material as restored:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in API route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
