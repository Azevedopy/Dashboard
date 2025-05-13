"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, RefreshCw, Download, Edit, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getSupabase } from "@/lib/supabase"
import { exportToCSV } from "@/lib/export-utils"
import { getMetrics } from "@/lib/data-service"
import { EditMetricDialog } from "@/components/metrics/edit-metric-dialog"

const supabase = getSupabase()

export default function GerenciarMetricasPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState([])
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState("todos")
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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

  const handleEditMetric = (metric) => {
    setSelectedMetric(metric)
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setSelectedMetric(null)
  }

  const handleEditSuccess = () => {
    fetchMetrics()
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy")
    } catch (error) {
      return dateString
    }
  }

  // Função para formatar tempo médio
  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}min`
    }
    return `${minutes} min`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Gerenciar Métricas</h1>
        <p className="text-sm text-muted-foreground">Visualize, edite e gerencie as métricas de atendimento</p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de Métricas</CardTitle>
              <CardDescription>Gerenciamento das métricas cadastradas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchMetrics} title="Atualizar">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={() => router.push("/cadastro-metricas")}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Métrica
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando métricas...</div>
            ) : metrics.length === 0 ? (
              <div className="text-center py-8">
                <p>Nenhuma métrica encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Data
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Membro
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Taxa de Resolução
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tempo Médio
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          CSAT
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          % Avaliados
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Tickets
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {metrics.map((metric) => (
                        <tr key={metric.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatDate(metric.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.member}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {metric.resolution_rate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTime(metric.average_response_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.csat_score}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {metric.evaluated_percentage}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {metric.resolved_tickets} / {metric.open_tickets + metric.resolved_tickets}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditMetric(metric)}
                              title="Editar métrica"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedMetric && (
        <EditMetricDialog
          isOpen={isEditDialogOpen}
          onClose={closeEditDialog}
          metric={selectedMetric}
          onSuccess={handleEditSuccess}
        />
      )}

      <Toaster />
    </div>
  )
}
