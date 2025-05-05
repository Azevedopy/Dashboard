"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, RefreshCw, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getSupabase } from "@/lib/supabase"
import { exportToCSV } from "@/lib/export-utils"
import { MetricsTable } from "./metrics-table"
// import { MetricsChart } from "./metrics-chart" // Removed MetricsChart import

const supabase = getSupabase()

export default function VisualizarMetricasPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState([])
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState("todos")
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    fetchMembers()
    fetchMetrics()
  }, [])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from("members").select("*").order("name")
      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error("Erro ao buscar membros:", error)
      toast({
        title: "Erro ao carregar membros",
        description: "Não foi possível carregar a lista de membros. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("metrics").select("*")

      // Filtrar por data
      if (dateRange.from) {
        query = query.gte("date", format(dateRange.from, "yyyy-MM-dd"))
      }
      if (dateRange.to) {
        query = query.lte("date", format(dateRange.to, "yyyy-MM-dd"))
      }

      // Filtrar por membro
      if (selectedMember !== "todos") {
        query = query.eq("member_id", selectedMember)
      }

      // Ordenar por data
      query = query.order("date", { ascending: false })

      const { data: metricsData, error: metricsError } = await query
      if (metricsError) throw metricsError

      // Buscar informações dos membros para cada métrica
      const membersMap = {}
      members.forEach((member) => {
        membersMap[member.id] = member
      })

      // Formatar os dados
      const formattedData = metricsData.map((metric) => ({
        id: metric.id,
        date: metric.date,
        member: membersMap[metric.member_id]?.name || "Desconhecido",
        member_id: metric.member_id,
        resolution_rate: metric.resolution_rate,
        average_response_time: metric.average_response_time,
        csat_score: metric.csat_score,
        evaluated_percentage: metric.evaluated_percentage,
        open_tickets: metric.open_tickets,
        resolved_tickets: metric.resolved_tickets,
        // Adicionar também propriedades camelCase para compatibilidade
        resolutionRate: metric.resolution_rate,
        averageResponseTime: metric.average_response_time,
        csatScore: metric.csat_score,
        evaluatedPercentage: metric.evaluated_percentage,
        openTickets: metric.open_tickets,
        resolvedTickets: metric.resolved_tickets,
      }))

      setMetrics(formattedData)
    } catch (error) {
      console.error("Erro ao buscar métricas:", error)
      toast({
        title: "Erro ao carregar métricas",
        description: "Não foi possível carregar as métricas. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilter = () => {
    fetchMetrics()
    setIsCalendarOpen(false)
  }

  const handleExport = () => {
    try {
      if (!metrics.length) {
        toast({
          title: "Sem dados para exportar",
          description: "Não há dados disponíveis para exportação.",
          variant: "destructive",
        })
        return
      }

      // Nome do arquivo baseado no filtro
      const fileName =
        selectedMember === "todos"
          ? "metricas_todos_atendentes"
          : `metricas_${members
              .find((m) => m.id === selectedMember)
              ?.name.toLowerCase()
              .replace(/\s+/g, "_")}`

      const result = exportToCSV(metrics, fileName)

      if (result.success) {
        toast({
          title: "Exportação concluída",
          description: result.message,
        })
      } else {
        toast({
          title: "Erro na exportação",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Visualização de Métricas</h1>
        <p className="text-sm text-muted-foreground">Visualize e analise as métricas de atendimento</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre as métricas por membro e período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">Membro</label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um membro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os membros</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "Selecione um período"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="w-full md:w-1/3 flex items-end gap-2">
                <Button onClick={handleFilter} className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrar
                </Button>
                <Button variant="outline" onClick={handleExport} disabled={!metrics.length}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updated section to show only the table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tabela de Métricas</CardTitle>
              <CardDescription>Dados detalhados das métricas</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchMetrics} title="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <MetricsTable metrics={metrics} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
