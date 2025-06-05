import { getSupabase } from "./supabase"

// Função para fazer diagnóstico completo dos dados
export async function runDiagnostics() {
  try {
    const supabase = getSupabase()
    console.log("🔍 INICIANDO DIAGNÓSTICO COMPLETO DOS DADOS")

    // 1. Verificar total de registros na tabela metrics
    const { count: totalCount, error: countError } = await supabase
      .from("metrics")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("❌ Erro ao contar registros:", countError)
      return
    }

    console.log(`📊 Total de registros na tabela 'metrics': ${totalCount}`)

    // 2. Verificar soma total de open_tickets
    const { data: sumData, error: sumError } = await supabase.from("metrics").select("open_tickets")

    if (sumError) {
      console.error("❌ Erro ao buscar open_tickets:", sumError)
      return
    }

    const totalOpenTickets =
      sumData?.reduce((sum, row) => {
        return sum + Number(row.open_tickets || 0)
      }, 0) || 0

    console.log(`🎫 Soma total de open_tickets: ${totalOpenTickets}`)

    // 3. Verificar distribuição por datas
    const { data: dateData, error: dateError } = await supabase
      .from("metrics")
      .select("date, open_tickets")
      .order("date", { ascending: false })

    if (dateError) {
      console.error("❌ Erro ao buscar datas:", dateError)
      return
    }

    const dateDistribution = dateData?.reduce(
      (acc, row) => {
        const date = row.date
        if (!acc[date]) {
          acc[date] = { count: 0, openTickets: 0 }
        }
        acc[date].count += 1
        acc[date].openTickets += Number(row.open_tickets || 0)
        return acc
      },
      {} as Record<string, { count: number; openTickets: number }>,
    )

    console.log("📅 Distribuição por data (últimas 10):")
    Object.entries(dateDistribution || {})
      .slice(0, 10)
      .forEach(([date, data]) => {
        console.log(`  ${date}: ${data.count} registros, ${data.openTickets} tickets abertos`)
      })

    // 4. Verificar se há registros com valores muito altos
    const { data: highValueData, error: highValueError } = await supabase
      .from("metrics")
      .select("date, member_id, open_tickets, resolved_tickets")
      .gt("open_tickets", 100)
      .order("open_tickets", { ascending: false })
      .limit(10)

    if (highValueError) {
      console.error("❌ Erro ao buscar valores altos:", highValueError)
      return
    }

    console.log("🔥 Registros com mais de 100 tickets abertos:")
    highValueData?.forEach((row, i) => {
      console.log(
        `  ${i + 1}. Data: ${row.date}, Membro: ${row.member_id}, Open: ${row.open_tickets}, Resolved: ${row.resolved_tickets}`,
      )
    })

    // 5. Verificar últimos 30 dias especificamente
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString().split("T")[0]

    const { data: recentData, error: recentError } = await supabase
      .from("metrics")
      .select("open_tickets")
      .gte("date", startDate)

    if (recentError) {
      console.error("❌ Erro ao buscar dados recentes:", recentError)
      return
    }

    const recentOpenTickets =
      recentData?.reduce((sum, row) => {
        return sum + Number(row.open_tickets || 0)
      }, 0) || 0

    console.log(`📊 Últimos 30 dias: ${recentData?.length} registros, ${recentOpenTickets} tickets abertos`)

    console.log("✅ DIAGNÓSTICO CONCLUÍDO")

    return {
      totalRecords: totalCount,
      totalOpenTickets,
      recentRecords: recentData?.length || 0,
      recentOpenTickets,
      dateDistribution,
    }
  } catch (error) {
    console.error("❌ Erro no diagnóstico:", error)
  }
}
