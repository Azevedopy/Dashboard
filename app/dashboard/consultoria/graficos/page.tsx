"use client"

import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Download, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ConsultoriaPieChart } from "@/components/dashboard/consultoria-pie-chart"
import { getConsultingProjects } from "@/lib/consulting-service"
import { exportToExcel } from "@/lib/export-utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Skeleton } from "@/components/ui/skeleton"

export default function ConsultoriaGraficosPage() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("all")
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let filters = {}

      // Atualizar o dateRange com base no período selecionado
      let newFrom
      const endDate = format(new Date(), "yyyy-MM-dd")

      if (period !== "all") {
        let startDate

        switch (period) {
          case "7d":
            newFrom = subDays(new Date(), 7)
            startDate = format(newFrom, "yyyy-MM-dd")
            break
          case "15d":
            newFrom = subDays(new Date(), 15)
            startDate = format(newFrom, "yyyy-MM-dd")
            break
          case "30d":
            newFrom = subDays(new Date(), 30)
            startDate = format(newFrom, "yyyy-MM-dd")
            break
          case "custom":
            startDate = format(dateRange.from, "yyyy-MM-dd")
            break
        }

        if (startDate) {
          filters = {
            startDate,
            endDate,
          }
        }

        // Atualizar o estado do dateRange para refletir o período selecionado
        if (newFrom && period !== "custom") {
          setDateRange({
            from: newFrom,
            to: new Date(),
          })
        }
      }

      console.log("Buscando projetos com filtros:", filters)
      const projectsData = await getConsultingProjects(filters)
      console.log("Projetos encontrados:", projectsData)
      setProjects(projectsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Erro ao carregar dados. Verifique sua conexão e tente novamente.")
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados dos projetos. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      if (!projects.length) {
        toast({
          title: "Sem dados para exportar",
          description: "Não há projetos disponíveis para exportação.",
          variant: "destructive",
        })
        return
      }

      const dataToExport = projects.map((project) => ({
        Cliente: project.cliente,
        Tipo: project.tipo,
        Consultor: project.consultor || "Não atribuído",
        "Data de Início": project.data_inicio ? format(new Date(project.data_inicio), "dd/MM/yyyy") : "N/A",
        "Data de Término": project.data_termino ? format(new Date(project.data_termino), "dd/MM/yyyy") : "N/A",
        "Valor da Consultoria": project.valor_consultoria,
        Status: project.status || "Em andamento",
        Porte: project.porte,
      }))

      exportToExcel(dataToExport, "consultorias_graficos")

      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados com sucesso.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleCustomDateFilter = () => {
    setPeriod("custom")
    setIsCalendarOpen(false)
    fetchData()
  }

  // Função auxiliar para mostrar o componente de erro
  const renderError = () => (
    <div className="w-full p-8 text-center">
      <p className="text-destructive mb-4">{error}</p>
      <Button onClick={fetchData} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Gráficos - Consultoria</h1>
        <p className="text-sm text-muted-foreground">Visualização gráfica dos dados de consultoria</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Tabs defaultValue={period} onValueChange={setPeriod} value={period}>
            <TabsList className="mb-2 sm:mb-0">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="7d">Últimos 7 dias</TabsTrigger>
              <TabsTrigger value="15d">Últimos 15 dias</TabsTrigger>
              <TabsTrigger value="30d">Últimos 30 dias</TabsTrigger>
              {period === "custom" && <TabsTrigger value="custom">Personalizado</TabsTrigger>}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 mr-auto sm:mr-0">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Selecione um período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange(range as { from: Date; to: Date })
                    }
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                />
                <div className="p-3 border-t border-border">
                  <Button size="sm" className="w-full" onClick={handleCustomDateFilter}>
                    Aplicar Filtro
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={handleExport} className="gap-2" disabled={!projects.length || isLoading}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>

            <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {error ? (
          renderError()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>Projetos de consultoria agrupados por tipo</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ConsultoriaPieChart data={projects} isLoading={false} groupByField="tipo" title="Tipo" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Porte</CardTitle>
                <CardDescription>
                  Projetos de consultoria agrupados por porte (Basic, Starter, Pro, Enterprise)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ConsultoriaPieChart data={projects} isLoading={false} groupByField="porte" title="Porte" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <CardDescription>Projetos de consultoria agrupados por status</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ConsultoriaPieChart data={projects} isLoading={false} groupByField="status" title="Status" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Consultor</CardTitle>
                <CardDescription>Projetos de consultoria agrupados por consultor</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ConsultoriaPieChart data={projects} isLoading={false} groupByField="consultor" title="Consultor" />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  )
}
