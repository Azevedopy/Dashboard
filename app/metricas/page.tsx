"use client"

import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Download, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getMembers, getMetrics, getMemberMetrics } from "@/lib/data-service"
import { exportToCSV } from "@/lib/export-utils"
import { MetricsTable } from "@/components/dashboard/metrics-table"
import { MetricsStats } from "@/components/dashboard/metrics-stats"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Member, MetricEntry } from "@/lib/supabase"

export default function MetricsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<MetricEntry[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState("all")
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

        let metricsData
        if (selectedMember === "all") {
          metricsData = await getMetrics(startDate, endDate)
        } else {
          metricsData = await getMemberMetrics(selectedMember, startDate, endDate)
        }

        setMetrics(metricsData)
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
  }, [selectedMember, dateRange])

  const handleFilter = () => {
    setIsCalendarOpen(false)
  }

  const handleExport = () => {
    try {
      // Preparar dados para exportação
      const exportData = metrics.map((metric) => {
        const member = members.find((m) => m.id === metric.member_id)
        return {
          date: metric.date,
          member: member?.name || "Desconhecido",
          resolution_rate: metric.resolution_rate,
          average_response_time: metric.average_response_time,
          csat_score: metric.csat_score,
          evaluated_percentage: metric.evaluated_percentage,
          open_tickets: metric.open_tickets,
          resolved_tickets: metric.resolved_tickets,
        }
      })

      // Nome do arquivo baseado no filtro
      const fileName =
        selectedMember === "all"
          ? "metricas_todos_atendentes"
          : `metricas_${members
              .find((m) => m.id === selectedMember)
              ?.name.toLowerCase()
              .replace(/\s+/g, "_")}`

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

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Métricas de Atendimento</h1>
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
                    <SelectItem value="all">Todos os membros</SelectItem>
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

        <MetricsStats metrics={metrics} isLoading={isLoading} />

        <Card>
          <CardHeader>
            <CardTitle>Dados de Métricas</CardTitle>
            <CardDescription>Visualize os dados detalhados das métricas</CardDescription>
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
