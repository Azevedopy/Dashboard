"use client"

import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Download, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ConsultingStats } from "@/components/consulting/consulting-stats"
import { getConsultingStats, getConsultingProjects } from "@/lib/consulting-service"
import { exportToExcel } from "@/lib/export-utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { ConsultingStats as ConsultingStatsType } from "@/lib/types"

export default function ConsultoriaVisaoGeralPage() {
  const [stats, setStats] = useState<ConsultingStatsType>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageRating: 0,
    totalRevenue: 0,
    averageProjectDuration: 0,
    deadlineComplianceRate: 0,
  })
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      let startDate
      const endDate = format(new Date(), "yyyy-MM-dd")

      // Atualizar o dateRange com base no período selecionado
      let newFrom
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
        default:
          newFrom = subDays(new Date(), 30)
          startDate = format(newFrom, "yyyy-MM-dd")
          break
      }

      // Atualizar o estado do dateRange para refletir o período selecionado
      if (newFrom && period !== "custom") {
        setDateRange({
          from: newFrom,
          to: new Date(),
        })
      }

      const filters = {
        startDate,
        endDate,
      }

      console.log("Buscando dados com filtros:", filters)

      // Buscar estatísticas e projetos em paralelo
      const [statsData, projectsData] = await Promise.all([getConsultingStats(filters), getConsultingProjects(filters)])

      console.log("Estatísticas encontradas:", statsData)
      console.log("Projetos encontrados:", projectsData)

      setStats(statsData)
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
        "Data de Início": format(new Date(project.data_inicio), "dd/MM/yyyy"),
        "Data de Término": format(new Date(project.data_termino), "dd/MM/yyyy"),
        "Valor da Consultoria": project.valor_consultoria,
        Status: project.status || "Em andamento",
        Porte: project.porte,
      }))

      exportToExcel(dataToExport, "consultorias_visao_geral")

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

    // Usar as datas selecionadas no calendário para filtrar
    const startDate = format(dateRange.from, "yyyy-MM-dd")
    const endDate = format(dateRange.to, "yyyy-MM-dd")

    const filters = {
      startDate,
      endDate,
    }

    setIsLoading(true)
    Promise.all([getConsultingStats(filters), getConsultingProjects(filters)])
      .then(([statsData, projectsData]) => {
        setStats(statsData)
        setProjects(projectsData)
      })
      .catch((error) => {
        console.error("Error fetching data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados. Tente novamente mais tarde.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho com faixa azul e texto branco */}
      <div className="p-6 bg-[#0056D6] text-white">
        <h1 className="text-2xl font-bold text-white">Visão Geral - Consultoria</h1>
        <p className="text-sm text-white/90">Resumo das principais métricas de consultoria</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Tabs defaultValue={period} onValueChange={setPeriod} value={period}>
            <TabsList>
              <TabsTrigger value="7d">Últimos 7 dias</TabsTrigger>
              <TabsTrigger value="15d">Últimos 15 dias</TabsTrigger>
              <TabsTrigger value="30d">Últimos 30 dias</TabsTrigger>
              {period === "custom" && <TabsTrigger value="custom">Personalizado</TabsTrigger>}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
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

            <Button variant="outline" onClick={handleExport} className="gap-2" disabled={!projects.length}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>

            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ConsultingStats stats={stats} isLoading={isLoading} />
      </div>
      <Toaster />
    </div>
  )
}
