"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Download, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompletedConsultingStats } from "@/components/consulting/completed-consulting-stats"
import { CompletedConsultingTable } from "@/components/consulting/completed-consulting-table"
import { ConsultantCommissionChart } from "@/components/consulting/consultant-commission-chart"
import { cn } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import { toast } from "@/components/ui/use-toast"
import {
  getCompletedConsultingProjects,
  getCompletedConsultingStats,
  getCompletedConsultores,
} from "@/lib/completed-consulting-service"
import type { ConsultingProject, ConsultingStats } from "@/lib/types"

export default function ConsultoriasConcluidasPage() {
  const [projects, setProjects] = useState<ConsultingProject[]>([])
  const [stats, setStats] = useState<ConsultingStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageRating: 0,
    totalRevenue: 0,
    averageProjectDuration: 0,
    deadlineComplianceRate: 0,
  })
  const [consultores, setConsultores] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    consultor: "todos",
    tipo: "todos",
    dateRange: {
      from: undefined as Date | undefined,
      to: undefined as Date | undefined,
    },
  })

  // Verificar se estamos em ambiente de preview
  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.dev")

  // Função de busca de dados refatorada para ser chamada em diferentes contextos
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Preparar filtros
      const apiFilters: {
        startDate?: string
        endDate?: string
        consultor?: string
      } = {}

      if (filters.dateRange.from) {
        apiFilters.startDate = format(filters.dateRange.from, "yyyy-MM-dd")
      }
      if (filters.dateRange.to) {
        apiFilters.endDate = format(filters.dateRange.to, "yyyy-MM-dd")
      }
      if (filters.consultor !== "todos") {
        apiFilters.consultor = filters.consultor
      }

      console.log("Buscando dados com os filtros:", apiFilters)

      // Buscar dados
      const [projectsData, statsData, consultoresData] = await Promise.all([
        getCompletedConsultingProjects(apiFilters),
        getCompletedConsultingStats(apiFilters),
        getCompletedConsultores(),
      ])

      // Filtrar por tipo se necessário
      let filteredProjects = projectsData
      if (filters.tipo !== "todos") {
        filteredProjects = projectsData.filter((project) => project.tipo?.toLowerCase() === filters.tipo.toLowerCase())
      }

      console.log(`Total de projetos encontrados: ${filteredProjects.length}`)
      setProjects(filteredProjects)
      setStats(statsData)
      setConsultores(consultoresData)

      // Mostrar toast de sucesso ao atualizar manualmente
      if (!isLoading) {
        toast({
          title: "Dados atualizados",
          description: `${filteredProjects.length} consultorias concluídas encontradas.`,
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Erro ao buscar dados",
        description: "Ocorreu um erro ao carregar as consultorias concluídas.",
        variant: "destructive",
      })

      // Em caso de erro, definir dados vazios ou mockados
      setProjects([])
      setConsultores([])
    } finally {
      setIsLoading(false)
    }
  }, [filters, isLoading])

  // Buscar dados na inicialização
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = () => {
    try {
      if (!projects.length) {
        toast({
          title: "Aviso",
          description: "Não há dados para exportar",
        })
        return
      }

      const dataToExport = projects.map((project) => ({
        Cliente: project.cliente,
        Tipo: project.tipo,
        Porte: project.porte,
        Consultor: project.consultor || "Não atribuído",
        "Data de Início": project.data_inicio,
        "Data de Término": project.data_termino,
        "Data de Finalização": project.data_finalizacao,
        "Duração (dias)": project.tempo_dias,
        "Valor da Consultoria": project.valor_consultoria,
        "Valor da Comissão": project.valor_comissao || 0,
        "Percentual de Comissão": project.percentual_comissao || 0,
        "Avaliação (Estrelas)": project.avaliacao_estrelas || "N/A",
        "Prazo Atingido": project.prazo_atingido ? "Sim" : "Não",
      }))

      if (isPreview) {
        toast({
          title: "Modo Preview",
          description: "A exportação não está disponível no modo preview.",
        })
      } else {
        exportToExcel(dataToExport, "consultorias_concluidas")
        toast({
          title: "Sucesso",
          description: "Dados exportados com sucesso",
        })
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Erro",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      })
    }
  }

  // Atualizar manualmente a lista
  const handleRefresh = () => {
    fetchData()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 bg-[#0056D6] text-white">
        <h1 className="text-2xl font-bold text-white">
          Consultorias Concluídas {isPreview && <span className="text-sm font-normal text-white/80">(Preview)</span>}
        </h1>
        <p className="text-sm text-white/90">Visualize e analise todas as consultorias que foram concluídas.</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold">Resumo</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filters.consultor} onValueChange={(value) => setFilters({ ...filters, consultor: value })}>
              <SelectTrigger className="w-[200px]">
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

            <Select value={filters.tipo} onValueChange={(value) => setFilters({ ...filters, tipo: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="consultoria">Consultoria</SelectItem>
                <SelectItem value="upsell">Upsell</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !filters.dateRange.from && !filters.dateRange.to && "text-muted-foreground",
                  )}
                >
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
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange.from}
                  selected={filters.dateRange}
                  onSelect={(range) =>
                    setFilters({ ...filters, dateRange: range || { from: undefined, to: undefined } })
                  }
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CompletedConsultingStats stats={stats} isLoading={isLoading} />

        <Tabs defaultValue="projetos">
          <TabsList>
            <TabsTrigger value="projetos">Projetos</TabsTrigger>
            <TabsTrigger value="comissoes">Comissões</TabsTrigger>
          </TabsList>
          <TabsContent value="projetos" className="space-y-4 mt-4">
            <CompletedConsultingTable projects={projects} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="comissoes" className="space-y-4 mt-4">
            <ConsultantCommissionChart
              consultores={consultores}
              startDate={filters.dateRange.from ? format(filters.dateRange.from, "yyyy-MM-dd") : undefined}
              endDate={filters.dateRange.to ? format(filters.dateRange.to, "yyyy-MM-dd") : undefined}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
