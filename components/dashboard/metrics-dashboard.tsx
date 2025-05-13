"use client"

import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, RefreshCw, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

import { MetricsStats } from "./metrics-stats"
import { MetricsTable } from "./metrics-table"
import { MetricsLineChart } from "./metrics-line-chart"
import { MetricsPieChart } from "./metrics-pie-chart"
import { getMetrics, getMembers } from "@/lib/data-service"
import { exportToCSV } from "@/lib/export-utils"

export function MetricsDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState([])
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState("todos")
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [activeMetricType, setActiveMetricType] = useState("resolution_rate")
  const [visibleMembers, setVisibleMembers] = useState({})

  useEffect(() => {
    fetchMembers()
    fetchMetrics()
  }, [])

  const fetchMembers = async () => {
    try {
      const data = await getMembers()
      setMembers(data)

      // Inicializar visibleMembers com todos os membros visíveis
      const initialVisibility = {}
      data.forEach((member) => {
        initialVisibility[member.name] = true
      })
      setVisibleMembers(initialVisibility)
    } catch (error) {
      console.error("Error fetching members:", error)
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
      // Formatar as datas para o formato yyyy-MM-dd para a API
      const fromDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
      const toDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

      // Buscar métricas usando o service
      let metricsData = await getMetrics(fromDate, toDate)

      // Filtrar por membro se necessário
      if (selectedMember !== "todos") {
        metricsData = metricsData.filter((metric) => metric.member_id === selectedMember)
      }

      setMetrics(metricsData)
    } catch (error) {
      console.error("Error fetching metrics:", error)
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

  const handleMemberToggle = (memberName) => {
    setVisibleMembers((prev) => ({
      ...prev,
      [memberName]: !prev[memberName],
    }))
  }

  // Filtrar métricas com base nos membros visíveis
  const filteredMetrics = metrics.filter((metric) => {
    if (!metric.member) return true
    return visibleMembers[metric.member] !== false // undefined também é considerado visível
  })

  return (
    <div className="space-y-6">
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
              <Button variant="outline" onClick={fetchMetrics} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={!metrics.length} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <MetricsStats metrics={filteredMetrics} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <CardTitle>Análise de Métricas</CardTitle>
          <CardDescription>Visualize as métricas em diferentes formatos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="comparison">Comparação</TabsTrigger>
              <TabsTrigger value="table">Tabela</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="h-[400px]">
                <MetricsLineChart metrics={filteredMetrics} isLoading={isLoading} />
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Select value={activeMetricType} onValueChange={setActiveMetricType}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Selecione uma métrica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resolution_rate">Taxa de Resolução</SelectItem>
                    <SelectItem value="average_response_time">Tempo Médio de Atendimento</SelectItem>
                    <SelectItem value="csat_score">CSAT</SelectItem>
                    <SelectItem value="evaluated_percentage">% de Atendimentos Avaliados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="h-[400px]">
                <MetricsPieChart
                  metrics={filteredMetrics}
                  isLoading={isLoading}
                  metricType={activeMetricType}
                  onMemberToggle={handleMemberToggle}
                />
              </div>
            </TabsContent>

            <TabsContent value="table">
              <MetricsTable metrics={filteredMetrics} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}
