import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabase.from("members").select("id, name").order("name")

    if (error) {
      console.error("Erro ao buscar membros:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, members: data })
  } catch (error) {
    console.error("Erro ao buscar membros:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido ao buscar membros",
      },
      { status: 500 },
    )
  }
}
