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
import { ActiveConsultingTable } from "@/components/consulting/active-consulting-table"
import { getConsultingProjects, getConsultores, updateConsultingProject } from "@/lib/consulting-service"
import { exportToExcel } from "@/lib/export-utils"
import { calculateCommission, isPrazoAtingido } from "@/lib/commission-utils"
import { toast } from "@/components/ui/use-toast"
import type { ConsultingProject } from "@/lib/types"

export default function ConsultoriasEmAndamentoPage() {
  const [projects, setProjects] = useState<ConsultingProject[]>([])
  const [consultores, setConsultores] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    consultor: "todos",
    tipo: "todos",
    dateRange: {
      from: new Date(new Date().getFullYear(), 0, 1), // Início do ano atual
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
      const filterParams: any = {
        status: "em_andamento", // Apenas projetos em andamento
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

      // Buscar projetos
      const projectsData = await getConsultingProjects(filterParams)

      // Filtrar por tipo se necessário
      let filteredProjects = projectsData
      if (filters.tipo !== "todos") {
        filteredProjects = projectsData.filter((project) => project.tipo.toLowerCase() === filters.tipo.toLowerCase())
      }

      setProjects(filteredProjects)
    } catch (error) {
      console.error("Error fetching data:", error)
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
        "Data de Início": format(new Date(project.data_inicio), "dd/MM/yyyy"),
        "Data de Término Prevista": format(new Date(project.data_termino), "dd/MM/yyyy"),
        "Duração (dias)": project.tempo_dias,
        "Valor da Consultoria": project.valor_consultoria,
        "Prazo Atingido": isPrazoAtingido(project.tipo, project.tempo_dias) ? "SIM" : "NÃO",
      }))

      exportToExcel(dataToExport, "consultorias_em_andamento")
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

  const handleFinalize = async (id: string, avaliacao: number) => {
    try {
      setIsLoading(true)

      // Buscar o projeto atual
      const project = projects.find((p) => p.id === id)
      if (!project) {
        throw new Error("Projeto não encontrado")
      }

      // Verificar se o prazo foi atingido
      const prazoAtingido = isPrazoAtingido(project.tipo, project.tempo_dias)

      // Calcular comissão
      const { percentual, valor } = calculateCommission(project.valor_consultoria, avaliacao, prazoAtingido)

      // Atualizar o projeto
      await updateConsultingProject({
        id,
        status: "concluido",
        data_finalizacao: new Date().toISOString().split("T")[0],
        avaliacao_estrelas: avaliacao,
        prazo_atingido: prazoAtingido,
        percentual_comissao: percentual,
        valor_comissao: valor,
      })

      toast({
        title: "Consultoria finalizada",
        description: `A consultoria para ${project.cliente} foi finalizada com sucesso.`,
      })

      // Recarregar dados
      fetchData()
    } catch (error) {
      console.error("Error finalizing project:", error)
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a consultoria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      setIsLoading(true)

      // Buscar o projeto atual
      const project = projects.find((p) => p.id === id)
      if (!project) {
        throw new Error("Projeto não encontrado")
      }

      // Atualizar o projeto
      await updateConsultingProject({
        id,
        status: "cancelado",
        data_finalizacao: new Date().toISOString().split("T")[0],
      })

      toast({
        title: "Consultoria cancelada",
        description: `A consultoria para ${project.cliente} foi cancelada.`,
      })

      // Recarregar dados
      fetchData()
    } catch (error) {
      console.error("Error canceling project:", error)
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a consultoria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Consultorias em Andamento</h1>
        <p className="text-sm text-muted-foreground">Visualize e acompanhe os projetos de consultoria ativos</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre os projetos por consultor, tipo e período</CardDescription>
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

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Projetos em Andamento</h2>
          <div className="text-sm text-muted-foreground">
            Total: {projects.length} projeto{projects.length !== 1 ? "s" : ""}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ActiveConsultingTable
              projects={projects}
              isLoading={isLoading}
              onFinalize={handleFinalize}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
