"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Download, Filter, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CompletedConsultingTable } from "@/components/consulting/completed-consulting-table"
import { CompletedConsultingStats } from "@/components/consulting/completed-consulting-stats"
import { getConsultingProjects, getConsultores } from "@/lib/consulting-service"
import { exportToExcel } from "@/lib/export-utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { ConsultingProject } from "@/lib/types"

export default function ConsultoriasConcluidas() {
  const [projects, setProjects] = useState<ConsultingProject[]>([])
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      console.log("🔄 Buscando consultorias concluídas...")

      // Buscar lista de consultores
      const consultoresList = await getConsultores()
      setConsultores(consultoresList)

      // Aplicar filtros para consultorias concluídas
      const filterParams: any = {
        status: "concluido", // Apenas projetos concluídos
      }

      console.log("Buscando projetos concluídos com filtros:", filterParams)

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
      const projectsData = await getConsultingProjects(filterParams)
      console.log(`✅ Projetos concluídos encontrados: ${projectsData.length}`)
      console.log("Dados dos projetos concluídos:", projectsData.slice(0, 3))

      // Filtrar por tipo se necessário
      let filteredProjects = projectsData
      if (filters.tipo !== "todos") {
        filteredProjects = projectsData.filter((project) => project.tipo.toLowerCase() === filters.tipo.toLowerCase())
        console.log(`Após filtro de tipo: ${filteredProjects.length} projetos`)
      }

      setProjects(filteredProjects)
    } catch (error) {
      console.error("❌ Erro ao buscar dados:", error)
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

  const handleExport = async () => {
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
        "Data de Início": project.data_inicio ? format(new Date(project.data_inicio), "dd/MM/yyyy") : "N/A",
        "Data de Término": project.data_termino ? format(new Date(project.data_termino), "dd/MM/yyyy") : "N/A",
        "Data de Conclusão": project.data_finalizacao
          ? format(new Date(project.data_finalizacao), "dd/MM/yyyy")
          : "N/A",
        "Duração (dias)": project.tempo_dias,
        "Valor da Consultoria": project.valor_consultoria,
        "Avaliação (estrelas)": project.avaliacao_estrelas || "N/A",
        "Comissão (%)": project.percentual_comissao || "N/A",
        "Valor da Comissão": project.valor_comissao || "N/A",
        "Prazo Atingido": project.prazo_atingido ? "SIM" : "NÃO",
      }))

      exportToExcel(dataToExport, "consultorias_concluidas")
      toast({
        title: "Sucesso",
        description: "Dados exportados com sucesso",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Erro",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 bg-[#0056D6] text-white">
        <h1 className="text-2xl font-bold text-white">Consultorias Concluídas</h1>
        <p className="text-sm text-white/90">Visualize e analise os projetos de consultoria finalizados</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Estatísticas */}
        <CompletedConsultingStats projects={projects} isLoading={isLoading} />

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre os projetos concluídos por consultor, tipo e período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
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
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={filters.tipo} onValueChange={(value) => setFilters({ ...filters, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="consultoria">Consultoria</SelectItem>
                    <SelectItem value="upsell">Upsell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/4">
                <label className="text-sm font-medium mb-2 block">Período de Conclusão</label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from && filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(filters.dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : filters.dateRange.from ? (
                        format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        "Todos os períodos"
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

              <div className="w-full md:w-1/4 flex items-end gap-2">
                <Button onClick={handleFilter} className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrar
                </Button>
                <Button variant="outline" onClick={handleExport} disabled={!projects.length}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Button variant="outline" size="icon" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cabeçalho da tabela */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Projetos Concluídos</h2>
          <div className="text-sm text-muted-foreground">
            Total: {projects.length} projeto{projects.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Tabela de projetos concluídos */}
        <Card>
          <CardContent className="p-0">
            <CompletedConsultingTable projects={projects} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
