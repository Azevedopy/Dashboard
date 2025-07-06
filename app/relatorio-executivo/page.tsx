"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarIcon,
  Download,
  Filter,
  RefreshCw,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Target,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ExecutiveSummaryCards } from "@/components/reports/executive-summary-cards"
import { RevenueAnalysisChart } from "@/components/reports/revenue-analysis-chart"
import { ConsultantPerformanceChart } from "@/components/reports/consultant-performance-chart"
import { ProjectTypeDistribution } from "@/components/reports/project-type-distribution"
import { BonificationAnalysis } from "@/components/reports/bonification-analysis"
import { ExecutiveTable } from "@/components/reports/executive-table"
import { getCompletedConsultingProjects, getCompletedConsultores } from "@/lib/completed-consulting-service"
import { exportExecutiveReportToPDF, exportExecutiveReportToExcel } from "@/lib/executive-export-utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { ConsultingProject } from "@/lib/types"

export default function RelatorioExecutivo() {
  const [projects, setProjects] = useState<ConsultingProject[]>([])
  const [consultores, setConsultores] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    consultor: "todos",
    tipo: "todos",
    porte: "todos",
    dateRange: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined,
    },
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      console.log("🔄 Carregando dados para relatório executivo...")

      // Buscar consultores
      const consultoresList = await getCompletedConsultores()
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

      // Buscar projetos concluídos
      const projectsData = await getCompletedConsultingProjects(filterParams)

      // Filtrar por tipo e porte se necessário
      let filteredProjects = projectsData

      if (filters.tipo !== "todos") {
        filteredProjects = filteredProjects.filter(
          (project) => project.tipo?.toLowerCase() === filters.tipo.toLowerCase(),
        )
      }

      if (filters.porte !== "todos") {
        filteredProjects = filteredProjects.filter(
          (project) => project.porte?.toLowerCase() === filters.porte.toLowerCase(),
        )
      }

      setProjects(filteredProjects)
      console.log(`✅ Carregados ${filteredProjects.length} projetos para o relatório`)
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados. Tente novamente.",
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

  const handleExportPDF = async () => {
    try {
      if (!projects.length) {
        toast({
          title: "Aviso",
          description: "Não há dados para exportar",
        })
        return
      }

      await exportExecutiveReportToPDF(projects)

      toast({
        title: "Sucesso",
        description: "Relatório executivo PDF gerado com sucesso!",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório PDF",
        variant: "destructive",
      })
    }
  }

  const handleExportExcel = async () => {
    try {
      if (!projects.length) {
        toast({
          title: "Aviso",
          description: "Não há dados para exportar",
        })
        return
      }

      await exportExecutiveReportToExcel(projects)

      toast({
        title: "Sucesso",
        description: "Relatório executivo Excel gerado com sucesso!",
      })
    } catch (error) {
      console.error("Error exporting Excel:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório Excel",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#0056D6] to-[#0041A3] text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              Relatório Executivo
            </h1>
            <p className="text-lg text-white/90 mt-2">Análise completa de performance e resultados das consultorias</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExportPDF}
              disabled={!projects.length || isLoading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportExcel}
              disabled={!projects.length || isLoading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Análise
            </CardTitle>
            <CardDescription>Configure os filtros para personalizar a análise dos dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Consultor</label>
                <Select
                  value={filters.consultor}
                  onValueChange={(value) => setFilters({ ...filters, consultor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os consultores" />
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

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={filters.tipo} onValueChange={(value) => setFilters({ ...filters, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="consultoria">Consultoria</SelectItem>
                    <SelectItem value="upsell">Upsell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Porte</label>
                <Select value={filters.porte} onValueChange={(value) => setFilters({ ...filters, porte: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os portes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os portes</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from && filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                          {format(filters.dateRange.to, "dd/MM/yy", { locale: ptBR })}
                        </>
                      ) : (
                        "Selecionar período"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={filters.dateRange}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setFilters({ ...filters, dateRange: range as { from: Date; to: Date } })
                        }
                      }}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleFilter} className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  Aplicar
                </Button>
                <Button variant="outline" size="icon" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Executivo */}
        <ExecutiveSummaryCards projects={projects} isLoading={isLoading} />

        {/* Tabs de Análise */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Receita
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="bonification" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Bonificações
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueAnalysisChart projects={projects} isLoading={isLoading} />
              <ProjectTypeDistribution projects={projects} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueAnalysisChart projects={projects} isLoading={isLoading} detailed />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <ConsultantPerformanceChart projects={projects} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="bonification" className="space-y-6">
            <BonificationAnalysis projects={projects} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <ExecutiveTable projects={projects} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

        {/* Status Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {projects.length} projeto{projects.length !== 1 ? "s" : ""} analisado
                  {projects.length !== 1 ? "s" : ""}
                </Badge>
                <span>Última atualização: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Dados atualizados</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </div>
  )
}
