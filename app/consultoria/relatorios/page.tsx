"use client"

import { useState, useEffect } from "react"
import { format, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, Download, BarChart2, PieChart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getConsultingProjects, getConsultores } from "@/lib/consulting-service"
import { exportToCSV } from "@/lib/export-utils"
import type { ConsultingProject } from "@/lib/types"

export default function ConsultingReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<ConsultingProject[]>([])
  const [consultores, setConsultores] = useState<string[]>([])
  const [filters, setFilters] = useState({
    consultor: "todos",
    dateRange: {
      from: subMonths(new Date(), 12),
      to: new Date(),
    },
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Buscar lista de consultores
      const consultoresList = await getConsultores()
      setConsultores(consultoresList)

      // Aplicar filtros
      const filterParams: any = {}
      if (filters.consultor !== "todos") {
        filterParams.consultor = filters.consultor
      }
      if (filters.dateRange.from) {
        filterParams.startDate = format(filters.dateRange.from, "yyyy-MM-dd")
      }
      if (filters.dateRange.to) {
        filterParams.endDate = format(filters.dateRange.to, "yyyy-MM-dd")
      }

      // Buscar projetos
      const projectsData = await getConsultingProjects(filterParams)
      setProjects(projectsData)
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

  const handleFilter = () => {
    fetchData()
    setIsCalendarOpen(false)
  }

  const handleExport = () => {
    try {
      if (!projects.length) {
        toast({
          title: "Sem dados para exportar",
          description: "Não há projetos disponíveis para exportação.",
          variant: "destructive",
        })
        return
      }

      // Preparar dados para exportação
      const exportData = projects.map((project) => ({
        cliente: project.cliente,
        tipo: project.tipo,
        consultor: project.consultor || "Não atribuído",
        data_inicio: format(new Date(project.data_inicio), "dd/MM/yyyy"),
        data_termino: format(new Date(project.data_termino), "dd/MM/yyyy"),
        tempo_dias: project.tempo_dias,
        porte: project.porte,
        valor_consultoria: project.valor_consultoria,
        valor_bonus: project.valor_bonus,
        status: project.status || "em_andamento",
        avaliacao_estrelas: project.avaliacao_estrelas || 0,
        prazo_atingido: project.prazo_atingido ? "Sim" : "Não",
      }))

      // Nome do arquivo
      const fileName = "relatorio_consultoria"

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

  // Calcular estatísticas para os gráficos
  const calculateStats = () => {
    if (!projects.length) return null

    // Projetos por tipo
    const byType = projects.reduce(
      (acc, project) => {
        acc[project.tipo] = (acc[project.tipo] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Projetos por porte
    const bySize = projects.reduce(
      (acc, project) => {
        acc[project.porte] = (acc[project.porte] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Projetos por status
    const byStatus = projects.reduce(
      (acc, project) => {
        const status = project.status || "em_andamento"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Valor total por consultor
    const byConsultor = projects.reduce(
      (acc, project) => {
        const consultor = project.consultor || "Não atribuído"
        acc[consultor] = (acc[consultor] || 0) + project.valor_consultoria
        return acc
      },
      {} as Record<string, number>,
    )

    return { byType, bySize, byStatus, byConsultor }
  }

  const stats = calculateStats()

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Relatórios de Consultoria</h1>
        <p className="text-sm text-muted-foreground">Análise e relatórios de projetos de consultoria</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre os relatórios por consultor e período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">Consultor</label>
                <Select
                  value={filters.consultor}
                  onValueChange={(value) => setFilters({ ...filters, consultor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um consultor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os consultores</SelectItem>
                    {consultores.map((consultor) => (
                      <SelectItem key={consultor} value={consultor}>
                        {consultor}
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
                      {filters.dateRange.from ? (
                        filters.dateRange.to ? (
                          <>
                            {format(filters.dateRange.from, "dd/MM/yyyy")} -{" "}
                            {format(filters.dateRange.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(filters.dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "Selecione um período"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={filters.dateRange}
                      onSelect={(range) =>
                        setFilters({ ...filters, dateRange: range || { from: undefined, to: undefined } })
                      }
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
                <Button variant="outline" onClick={handleExport} disabled={!projects.length}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tipo">
          <TabsList>
            <TabsTrigger value="tipo">
              <PieChart className="h-4 w-4 mr-2" />
              Por Tipo
            </TabsTrigger>
            <TabsTrigger value="porte">
              <PieChart className="h-4 w-4 mr-2" />
              Por Porte
            </TabsTrigger>
            <TabsTrigger value="status">
              <PieChart className="h-4 w-4 mr-2" />
              Por Status
            </TabsTrigger>
            <TabsTrigger value="consultor">
              <BarChart2 className="h-4 w-4 mr-2" />
              Por Consultor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tipo" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Projetos por Tipo</CardTitle>
                <CardDescription>Distribuição de projetos por tipo de consultoria</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                {isLoading ? (
                  <p>Carregando dados...</p>
                ) : !stats ? (
                  <p>Nenhum dado disponível</p>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium">Total de Projetos: {projects.length}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                      {Object.entries(stats.byType).map(([type, count]) => (
                        <Card key={type}>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <h4 className="font-medium">{type}</h4>
                              <p className="text-2xl font-bold mt-2">{count}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {((count / projects.length) * 100).toFixed(1)}% do total
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="porte" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Projetos por Porte</CardTitle>
                <CardDescription>Distribuição de projetos por porte do cliente</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                {isLoading ? (
                  <p>Carregando dados...</p>
                ) : !stats ? (
                  <p>Nenhum dado disponível</p>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium">Total de Projetos: {projects.length}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                      {Object.entries(stats.bySize).map(([size, count]) => (
                        <Card key={size}>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <h4 className="font-medium">{size}</h4>
                              <p className="text-2xl font-bold mt-2">{count}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {((count / projects.length) * 100).toFixed(1)}% do total
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Projetos por Status</CardTitle>
                <CardDescription>Distribuição de projetos por status atual</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                {isLoading ? (
                  <p>Carregando dados...</p>
                ) : !stats ? (
                  <p>Nenhum dado disponível</p>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium">Total de Projetos: {projects.length}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      {Object.entries(stats.byStatus).map(([status, count]) => {
                        let statusLabel = "Desconhecido"
                        let statusColor = "bg-gray-100"

                        if (status === "em_andamento") {
                          statusLabel = "Em Andamento"
                          statusColor = "bg-blue-100 text-blue-800"
                        } else if (status === "concluido") {
                          statusLabel = "Concluído"
                          statusColor = "bg-green-100 text-green-800"
                        } else if (status === "cancelado") {
                          statusLabel = "Cancelado"
                          statusColor = "bg-red-100 text-red-800"
                        }

                        return (
                          <Card key={status}>
                            <CardContent className={`p-4 ${statusColor}`}>
                              <div className="text-center">
                                <h4 className="font-medium">{statusLabel}</h4>
                                <p className="text-2xl font-bold mt-2">{count}</p>
                                <p className="text-sm mt-1">{((count / projects.length) * 100).toFixed(1)}% do total</p>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultor" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Valor por Consultor</CardTitle>
                <CardDescription>Valor total de projetos por consultor</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                {isLoading ? (
                  <p>Carregando dados...</p>
                ) : !stats ? (
                  <p>Nenhum dado disponível</p>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium">
                        Valor Total:{" "}
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          projects.reduce((sum, p) => sum + p.valor_consultoria, 0),
                        )}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4 w-full">
                      {Object.entries(stats.byConsultor).map(([consultor, value]) => (
                        <Card key={consultor}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">{consultor}</h4>
                              <p className="text-xl font-bold">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}
                              </p>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{
                                  width: `${(value / projects.reduce((sum, p) => sum + p.valor_consultoria, 0)) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
