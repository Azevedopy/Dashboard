"use client"

import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, BarChart2, PieChart, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getMembers, getMetrics } from "@/lib/data-service"
import { exportToCSV } from "@/lib/export-utils"
import { MetricsPieChart } from "@/components/dashboard/metrics-pie-chart"
import type { Member, MetricEntry } from "@/lib/supabase"

export default function ComparisonPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<MetricEntry[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMetric, setSelectedMetric] = useState("csat_score")
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const membersData = await getMembers()
        setMembers(membersData)

        const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
        const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

        const metricsData = await getMetrics(startDate, endDate)

        // Adicionar nome do membro a cada métrica
        const metricsWithMemberNames = metricsData.map((metric) => {
          const member = membersData.find((m) => m.id === metric.member_id)
          return {
            ...metric,
            member: member?.name || "Desconhecido",
          }
        })

        setMetrics(metricsWithMemberNames)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados. Tente novamente mais tarde.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const handleFilter = () => {
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

      // Preparar dados para exportação
      const exportData = metrics.map((metric) => ({
        date: metric.date,
        member: metric.member,
        [selectedMetric]: metric[selectedMetric],
      }))

      // Nome do arquivo baseado no filtro
      const metricName = metricOptions.find((option) => option.value === selectedMetric)?.label || selectedMetric
      const fileName = `comparacao_${metricName.toLowerCase().replace(/\s+/g, "_")}`

      const result = exportToCSV(exportData, fileName)

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

  const metricOptions = [
    { value: "csat_score", label: "CSAT" },
    { value: "resolution_rate", label: "Taxa de Resolução" },
    { value: "average_response_time", label: "Tempo Médio" },
    { value: "evaluated_percentage", label: "% Avaliados" },
    { value: "resolved_tickets", label: "Tickets Resolvidos" },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Comparação de Métricas</h1>
        <p className="text-sm text-muted-foreground">Compare métricas entre atendentes por período</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione a métrica e o período para comparação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">Métrica</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma métrica" />
                  </SelectTrigger>
                  <SelectContent>
                    {metricOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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

        <Tabs defaultValue="pie">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="pie">
                <PieChart className="h-4 w-4 mr-2" />
                Gráfico de Pizza
              </TabsTrigger>
              <TabsTrigger value="bar">
                <BarChart2 className="h-4 w-4 mr-2" />
                Gráfico de Barras
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pie" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Comparação por Atendente</CardTitle>
                <CardDescription>
                  {metricOptions.find((option) => option.value === selectedMetric)?.label || selectedMetric} médio por
                  atendente
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <MetricsPieChart metrics={metrics} isLoading={isLoading} metricType={selectedMetric} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bar" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Comparação por Atendente</CardTitle>
                <CardDescription>
                  {metricOptions.find((option) => option.value === selectedMetric)?.label || selectedMetric} médio por
                  atendente
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {/* Implementar gráfico de barras aqui */}
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Gráfico de barras em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
