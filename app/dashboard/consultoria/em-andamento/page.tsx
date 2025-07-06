"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Download, Filter, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

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
      from: undefined as Date | undefined,
      to: undefined as Date | undefined,
    },
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Buscar lista de consultores
      const consultoresList = await getConsultores()
      setConsultores(consultoresList)

      // Aplicar filtros - buscar projetos em andamento E pausados
      const filterParams: any = {}

      console.log("Buscando projetos em andamento e pausados com filtros:", filterParams)

      if (filters.consultor !== "todos") {
        filterParams.consultor = filters.consultor
      }

      // Só aplicar filtros de data se foram especificados
      if (filters.dateRange.from) {
        filterParams.startDate = format(filters.dateRange.from, "yyyy-MM-dd")
      }

      if (filters.dateRange.to) {
        filterParams.endDate = format(filters.dateRange.to, "yyyy-MM-dd")
      }

      // Buscar todos os projetos e filtrar por status localmente
      const allProjects = await getConsultingProjects(filterParams)

      // Filtrar para mostrar apenas projetos em andamento ou pausados
      let filteredProjects = allProjects.filter(
        (project) => project.status === "em_andamento" || project.status === "pausado",
      )

      console.log(`Projetos em andamento/pausados encontrados: ${filteredProjects.length}`)
      console.log("Dados dos projetos:", filteredProjects)

      // Filtrar por tipo se necessário
      if (filters.tipo !== "todos") {
        filteredProjects = filteredProjects.filter(
          (project) => project.tipo && project.tipo.toLowerCase() === filters.tipo.toLowerCase(),
        )
        console.log(`Após filtro de tipo: ${filteredProjects.length} projetos`)
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

      const dataToExport = projects.map((project) => {
        const diasEfetivos = Math.max(0, (project.tempo_dias || 0) - (project.dias_pausados || 0))
        const isPaused = project.data_pausa !== null && project.data_pausa !== undefined

        return {
          Cliente: project.cliente || "N/A",
          Tipo: project.tipo || "N/A",
          Porte: project.porte || "N/A",
          Consultor: project.consultor || "Não atribuído",
          "Data de Início": project.data_inicio ? format(new Date(project.data_inicio), "dd/MM/yyyy") : "N/A",
          "Data de Término Prevista": project.data_termino
            ? format(new Date(project.data_termino), "dd/MM/yyyy")
            : "N/A",
          "Dias Totais": project.tempo_dias || 0,
          "Dias Pausados": project.dias_pausados || 0,
          "Dias Efetivos": diasEfetivos,
          "Valor da Consultoria": project.valor_consultoria || 0,
          Status: isPaused ? "Pausado" : "Em Andamento",
          "Prazo Atingido":
            project.tipo && diasEfetivos ? (isPrazoAtingido(project.tipo, diasEfetivos) ? "SIM" : "NÃO") : "N/A",
        }
      })

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

  const handleFinalize = async (id: string, avaliacao: number, assinaturaFechamento: boolean) => {
    try {
      setIsLoading(true)

      // Buscar o projeto atual com verificação de segurança
      const project = projects.find((p) => p && p.id === id)
      if (!project) {
        console.error("Projeto não encontrado com ID:", id)
        console.log(
          "Projetos disponíveis:",
          projects.map((p) => ({ id: p?.id, cliente: p?.cliente })),
        )
        throw new Error("Projeto não encontrado")
      }

      console.log("Projeto encontrado para finalização:", project)

      // Calcular dias efetivos (descontando dias pausados)
      const diasEfetivos = Math.max(0, (project.tempo_dias || 0) - (project.dias_pausados || 0))

      // Verificar se o prazo foi atingido baseado nos dias efetivos
      const prazoAtingido = project.tipo ? isPrazoAtingido(project.tipo, diasEfetivos) : false

      // Calcular comissão baseada nos dias efetivos
      const { percentual, valor } = calculateCommission(project.valor_consultoria || 0, avaliacao, prazoAtingido)

      const updateData = {
        id,
        status: "concluido",
        data_finalizacao: new Date().toISOString().split("T")[0],
        avaliacao_estrelas: avaliacao,
        prazo_atingido: prazoAtingido,
        percentual_comissao: percentual,
        valor_comissao: valor,
        assinatura_fechamento: assinaturaFechamento,
        data_pausa: null, // Limpar data de pausa ao finalizar
        updated_at: new Date().toISOString(),
      }

      console.log("Finalizando consultoria com dados:", updateData)

      // Atualizar o projeto
      const result = await updateConsultingProject(updateData)

      if (!result) {
        throw new Error("Erro ao finalizar consultoria")
      }

      toast({
        title: "Consultoria finalizada",
        description: `A consultoria para ${project.cliente} foi finalizada com sucesso.${
          assinaturaFechamento ? " Assinatura de fechamento confirmada." : ""
        } Dias efetivos considerados: ${diasEfetivos}`,
      })

      // Recarregar dados após finalizar para remover da lista atual
      await fetchData()

      // Aguardar um pouco antes de redirecionar para garantir que os dados foram salvos
      setTimeout(() => {
        router.push("/dashboard/consultoria/concluidas")
      }, 2000)
    } catch (error) {
      console.error("Error finalizing project:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível finalizar a consultoria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      setIsLoading(true)

      // Buscar o projeto atual com verificação de segurança
      const project = projects.find((p) => p && p.id === id)
      if (!project) {
        console.error("Projeto não encontrado com ID:", id)
        throw new Error("Projeto não encontrado")
      }

      console.log("Projeto encontrado para cancelamento:", project)

      // Atualizar o projeto
      const result = await updateConsultingProject({
        id,
        status: "cancelado",
        data_finalizacao: new Date().toISOString().split("T")[0],
        data_pausa: null, // Limpar data de pausa ao cancelar
        updated_at: new Date().toISOString(),
      })

      if (!result) {
        throw new Error("Erro ao cancelar consultoria")
      }

      toast({
        title: "Consultoria cancelada",
        description: `A consultoria para ${project.cliente} foi cancelada.`,
      })

      // Recarregar dados
      await fetchData()
    } catch (error) {
      console.error("Error canceling project:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível cancelar a consultoria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePause = async (id: string) => {
    try {
      setIsLoading(true)

      // Buscar o projeto atual com verificação de segurança
      const project = projects.find((p) => p && p.id === id)
      if (!project) {
        console.error("Projeto não encontrado com ID:", id)
        throw new Error("Projeto não encontrado")
      }

      console.log("Projeto encontrado para pausar:", project)

      // Calcular dias já decorridos desde o início
      const dataInicio = new Date(project.data_inicio)
      const hoje = new Date()
      const diasDecorridos = Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))

      // Atualizar o projeto para pausado
      const result = await updateConsultingProject({
        id,
        data_pausa: new Date().toISOString(),
        // Incrementar dias pausados se já havia pausas anteriores
        dias_pausados: project.dias_pausados || 0,
        updated_at: new Date().toISOString(),
      })

      if (!result) {
        throw new Error("Erro ao pausar consultoria")
      }

      toast({
        title: "Consultoria pausada",
        description: `A consultoria para ${project.cliente} foi pausada. Os dias não serão mais contabilizados para bonificação.`,
      })

      // Recarregar dados
      await fetchData()
    } catch (error) {
      console.error("Error pausing project:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível pausar a consultoria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResume = async (id: string) => {
    try {
      setIsLoading(true)

      // Buscar o projeto atual com verificação de segurança
      const project = projects.find((p) => p && p.id === id)
      if (!project) {
        console.error("Projeto não encontrado com ID:", id)
        throw new Error("Projeto não encontrado")
      }

      console.log("Projeto encontrado para retomar:", project)

      // Calcular quantos dias ficou pausado
      if (project.data_pausa) {
        const dataPausa = new Date(project.data_pausa)
        const hoje = new Date()
        const diasPausadosAgora = Math.floor((hoje.getTime() - dataPausa.getTime()) / (1000 * 60 * 60 * 24))

        // Atualizar o projeto para retomar
        const result = await updateConsultingProject({
          id,
          data_pausa: null, // Remove a data de pausa
          dias_pausados: (project.dias_pausados || 0) + diasPausadosAgora, // Soma os dias pausados
          updated_at: new Date().toISOString(),
        })

        if (!result) {
          throw new Error("Erro ao retomar consultoria")
        }

        toast({
          title: "Consultoria retomada",
          description: `A consultoria para ${project.cliente} foi retomada. Foram pausados ${diasPausadosAgora} dias adicionais.`,
        })
      }

      // Recarregar dados
      await fetchData()
    } catch (error) {
      console.error("Error resuming project:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível retomar a consultoria. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 bg-[#0056D6] text-white">
        <h1 className="text-2xl font-bold text-white">Consultorias em Andamento</h1>
        <p className="text-sm text-white/90">
          Visualize e acompanhe os projetos de consultoria ativos (incluindo pausados)
        </p>
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

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Projetos em Andamento</h2>
          <div className="text-sm text-muted-foreground">
            Total: {projects.length} projeto{projects.length !== 1 ? "s" : ""}
            {projects.filter((p) => p.data_pausa).length > 0 && (
              <span className="text-orange-600 ml-2">
                ({projects.filter((p) => p.data_pausa).length} pausado
                {projects.filter((p) => p.data_pausa).length !== 1 ? "s" : ""})
              </span>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <ActiveConsultingTable
              projects={projects}
              isLoading={isLoading}
              onFinalize={handleFinalize}
              onCancel={handleCancel}
              onPause={handlePause}
              onResume={handleResume}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
