"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, PlusCircle, Download, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ConsultingStats } from "@/components/consulting/consulting-stats"
import { ConsultingTable } from "@/components/consulting/consulting-table"
import {
  getConsultingProjects,
  getConsultingStats,
  getConsultores,
  deleteConsultingProject,
} from "@/lib/consulting-service"
import { exportToCSV } from "@/lib/export-utils"
import type { ConsultingProject, ConsultingStats as ConsultingStatsType } from "@/lib/types"

export default function ConsultingProjectsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<ConsultingProject[]>([])
  const [stats, setStats] = useState<ConsultingStatsType>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageRating: 0,
    totalRevenue: 0,
    averageProjectDuration: 0,
    deadlineComplianceRate: 0,
  })
  const [consultores, setConsultores] = useState<string[]>([])
  const [filters, setFilters] = useState({
    status: "todos",
    consultor: "todos",
    dateRange: {
      from: subMonths(new Date(), 6),
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
      if (filters.status !== "todos") {
        filterParams.status = filters.status
      }
      if (filters.consultor !== "todos") {
        filterParams.consultor = filters.consultor
      }
      if (filters.dateRange.from) {
        filterParams.startDate = format(filters.dateRange.from, "yyyy-MM-dd")
      }
      if (filters.dateRange.to) {
        filterParams.endDate = format(filters.dateRange.to, "yyyy-MM-dd")
      }

      // Buscar projetos e estatísticas
      const [projectsData, statsData] = await Promise.all([
        getConsultingProjects(filterParams),
        getConsultingStats(filterParams),
      ])

      setProjects(projectsData)
      setStats(statsData)
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

  const handleDeleteProject = async (id: string) => {
    try {
      const success = await deleteConsultingProject(id)
      if (success) {
        toast({
          title: "Projeto excluído",
          description: "O projeto foi excluído com sucesso.",
        })
        fetchData()
      } else {
        throw new Error("Falha ao excluir projeto")
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Erro ao excluir projeto",
        description: "Não foi possível excluir o projeto. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
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
      const fileName = "projetos_consultoria"

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
        <h1 className="text-2xl font-bold">Projetos de Consultoria</h1>
        <p className="text-sm text-muted-foreground">Gerencie e acompanhe os projetos de consultoria</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre os projetos por status, consultor e período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/4">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/4">
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

              <div className="w-full md:w-1/4">
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

              <div className="w-full md:w-1/4 flex items-end gap-2">
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

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Estatísticas</h2>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <ConsultingStats stats={stats} isLoading={isLoading} />

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Projetos</h2>
          <Button onClick={() => router.push("/consultoria/projetos/novo")} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <ConsultingTable projects={projects} isLoading={isLoading} onDelete={handleDeleteProject} />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
