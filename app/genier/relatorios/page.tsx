"use client"

import { useState, useEffect } from "react"
import { format, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, Download, BarChart2, PieChart, LineChart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getGenierProjects,
  getGenierProjectTypes,
  getGenierConsultants,
  getGenierProjectSizes,
} from "@/lib/genier-service"
import { exportToCSV } from "@/lib/export-utils"
import { useToast } from "@/components/ui/use-toast"

export default function GenierRelatoriosPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [projectTypes, setProjectTypes] = useState([])
  const [consultants, setConsultants] = useState([])
  const [projectSizes, setProjectSizes] = useState([])
  const [filters, setFilters] = useState({
    tipo: "",
    consultor: "",
    porte: "",
    dateRange: {
      from: subMonths(new Date(), 6),
      to: new Date(),
    },
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Buscar tipos de projetos, consultores e portes
        const [projectsData, typesData, consultantsData, sizesData] = await Promise.all([
          getGenierProjects({
            startDate: format(filters.dateRange.from, "yyyy-MM-dd"),
            endDate: format(filters.dateRange.to, "yyyy-MM-dd"),
          }),
          getGenierProjectTypes(),
          getGenierConsultants(),
          getGenierProjectSizes(),
        ])

        setProjects(projectsData)
        setProjectTypes(typesData)
        setConsultants(consultantsData)
        setProjectSizes(sizesData)
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados dos relatórios.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleFilter = async () => {
    setIsLoading(true)
    try {
      const filteredProjects = await getGenierProjects({
        tipo: filters.tipo,
        consultor: filters.consultor,
        porte: filters.porte,
        startDate: filters.dateRange.from ? format(filters.dateRange.from, "yyyy-MM-dd") : undefined,
        endDate: filters.dateRange.to ? format(filters.dateRange.to, "yyyy-MM-dd") : undefined,
      })
      setProjects(filteredProjects)
      setIsCalendarOpen(false)
    } catch (error) {
      console.error("Erro ao filtrar projetos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível filtrar os projetos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (!projects.length) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar.",
        variant: "warning",
      })
      return
    }

    const result = exportToCSV(projects, "relatorio_genier")
    toast({
      title: result.success ? "Sucesso" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
  }

  // Calcular estatísticas para os relatórios
  const calculateStats = () => {
    if (!projects.length) return null

    // Projetos por tipo
    const byType = projectTypes.map((type) => ({
      name: type,
      value: projects.filter((p) => p.tipo === type).length,
    }))

    // Projetos por consultor
    const byConsultant = consultants.map((consultant) => ({
      name: consultant,
      value: projects.filter((p) => p.consultor === consultant).length,
    }))

    // Projetos por porte
    const bySize = projectSizes.map((size) => ({
      name: size,
      value: projects.filter((p) => p.porte === size).length,
    }))

    // Projetos por status
    const byStatus = [
      { name: "Em Andamento", value: projects.filter((p) => p.status === "em_andamento").length },
      { name: "Concluído", value: projects.filter((p) => p.status === "concluido").length },
      { name: "Atrasado", value: projects.filter((p) => p.status === "atrasado").length },
      { name: "Cancelado", value: projects.filter((p) => p.status === "cancelado").length },
    ]

    return { byType, byConsultant, bySize, byStatus }
  }

  const stats = calculateStats()

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Relatórios Genier</h1>
        <p className="text-sm text-muted-foreground">Análise e visualização de dados dos projetos Genier</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine sua análise por período, tipo, consultor e porte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        filters.dateRange.to ? (
                          <>
                            {format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                            {format(filters.dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                          </>
                        ) : (
                          format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
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

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={filters.tipo} onValueChange={(value) => setFilters({ ...filters, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {projectTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Consultor</label>
                <Select
                  value={filters.consultor}
                  onValueChange={(value) => setFilters({ ...filters, consultor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um consultor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {consultants.map((consultant) => (
                      <SelectItem key={consultant} value={consultant}>
                        {consultant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Porte</label>
                <Select value={filters.porte} onValueChange={(value) => setFilters({ ...filters, porte: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um porte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {projectSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button onClick={handleFilter}>
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tipo">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="tipo">
                <PieChart className="h-4 w-4 mr-2" />
                Por Tipo
              </TabsTrigger>
              <TabsTrigger value="consultor">
                <BarChart2 className="h-4 w-4 mr-2" />
                Por Consultor
              </TabsTrigger>
              <TabsTrigger value="porte">
                <LineChart className="h-4 w-4 mr-2" />
                Por Porte
              </TabsTrigger>
              <TabsTrigger value="status">
                <PieChart className="h-4 w-4 mr-2" />
                Por Status
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tipo" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Projetos por Tipo</CardTitle>
                <CardDescription>Análise da quantidade de projetos por tipo</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : !stats ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Nenhum dado disponível</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-md">
                          <p className="text-center mb-4">Gráfico em desenvolvimento</p>
                          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                            <PieChart className="h-12 w-12 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-4">Detalhamento por Tipo</h3>
                        <div className="space-y-2">
                          {stats.byType.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <span>{item.name}</span>
                              <span className="font-medium">{item.value} projetos</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultor" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Projetos por Consultor</CardTitle>
                <CardDescription>Análise da quantidade de projetos por consultor</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : !stats ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Nenhum dado disponível</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-md">
                          <p className="text-center mb-4">Gráfico em desenvolvimento</p>
                          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                            <BarChart2 className="h-12 w-12 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-4">Detalhamento por Consultor</h3>
                        <div className="space-y-2">
                          {stats.byConsultant.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <span>{item.name}</span>
                              <span className="font-medium">{item.value} projetos</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="porte" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Projetos por Porte</CardTitle>
                <CardDescription>Análise da quantidade de projetos por porte</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : !stats ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Nenhum dado disponível</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-md">
                          <p className="text-center mb-4">Gráfico em desenvolvimento</p>
                          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                            <LineChart className="h-12 w-12 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-4">Detalhamento por Porte</h3>
                        <div className="space-y-2">
                          {stats.bySize.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <span>{item.name}</span>
                              <span className="font-medium">{item.value} projetos</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Projetos por Status</CardTitle>
                <CardDescription>Análise da quantidade de projetos por status</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : !stats ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Nenhum dado disponível</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-center">
                        <div className="w-full max-w-md">
                          <p className="text-center mb-4">Gráfico em desenvolvimento</p>
                          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                            <PieChart className="h-12 w-12 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-4">Detalhamento por Status</h3>
                        <div className="space-y-2">
                          {stats.byStatus.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                              <span>{item.name}</span>
                              <span className="font-medium">{item.value} projetos</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
