"use client"

import { useEffect, useState } from "react"
import { format, subDays } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricsStats } from "./metrics-stats"
import { MetricsPieChart } from "./metrics-pie-chart"
import { getSupabase } from "@/lib/supabase"

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState([])
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMetricType, setSelectedMetricType] = useState("csat_score")
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [selectedMember, setSelectedMember] = useState("all")

  useEffect(() => {
    fetchData()
  }, [selectedPeriod, selectedMember])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabase()

      // Buscar membros
      const { data: membersData, error: membersError } = await supabase.from("members").select("*").order("name")

      if (membersError) throw membersError
      setMembers(membersData || [])

      // Calcular data inicial com base no período selecionado
      const today = new Date()
      const startDate = format(subDays(today, Number.parseInt(selectedPeriod)), "yyyy-MM-dd")

      // Construir a consulta
      let query = supabase.from("metrics").select("*").gte("date", startDate)

      // Filtrar por membro se necessário
      if (selectedMember !== "all") {
        query = query.eq("member_id", selectedMember)
      }

      const { data: metricsData, error: metricsError } = await query

      if (metricsError) throw metricsError

      // Estrutura para mapear IDs de membros para nomes
      const memberMap = {}
      membersData?.forEach((member) => {
        memberMap[member.id] = member.name
      })

      // Formatar dados de métricas
      const formattedMetrics = metricsData?.map((metric) => ({
        ...metric,
        member: memberMap[metric.member_id] || "Desconhecido",
      }))

      setMetrics(formattedMetrics || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Métricas</h2>
          <p className="text-muted-foreground">Visão geral das métricas de atendimento</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Membro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os membros</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
        </div>
      ) : (
        <>
          <MetricsStats metrics={metrics} isLoading={isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparação entre Membros</CardTitle>
                <CardDescription>Análise comparativa de desempenho</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Tabs defaultValue="csat" onValueChange={setSelectedMetricType}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="csat_score">CSAT</TabsTrigger>
                    <TabsTrigger value="resolution_rate">Taxa de Resolução</TabsTrigger>
                    <TabsTrigger value="average_response_time">Tempo de Resposta</TabsTrigger>
                  </TabsList>
                  <div className="h-[250px]">
                    <MetricsPieChart metrics={metrics} isLoading={isLoading} metricType={selectedMetricType} />
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>Análise por tipo de atendimento</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="h-[250px] flex items-center justify-center">
                  {metrics.length > 0 ? (
                    <MetricsPieChart
                      metrics={metrics.map((m) => ({
                        ...m,
                        member: m.tipo,
                      }))}
                      isLoading={isLoading}
                      metricType="csat_score"
                    />
                  ) : (
                    <p className="text-muted-foreground">Nenhum dado disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
