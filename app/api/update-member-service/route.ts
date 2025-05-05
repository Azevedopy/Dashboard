import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { memberId, serviceType } = await request.json()

    if (!memberId || !serviceType) {
      return NextResponse.json({ error: "Member ID and service type are required" }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from("members")
      .update({ service_type: serviceType })
      .eq("id", memberId)
      .select()
      .single()

    if (error) {
      console.error("Error updating member service type:", error)
      return NextResponse.json({ error: "Failed to update member service type" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
