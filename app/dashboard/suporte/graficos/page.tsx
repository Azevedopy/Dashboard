"use client"

import { useState, useEffect } from "react"
import { format, subDays, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, RefreshCw, Filter, X, Info, Edit, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getMembers, getMetrics } from "@/lib/data-service"
import { MetricsPieChart } from "@/components/dashboard/metrics-pie-chart"
import { MetricsLineChart } from "@/components/dashboard/metrics-line-chart"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { EditMetricDialog } from "@/components/metrics/edit-metric-dialog"
import { exportToCSV } from "@/lib/export-utils"

export default function GraficosPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState([])
  const [members, setMembers] = useState([])
  const [selectedMetric, setSelectedMetric] = useState("resolution_rate")
  const [period, setPeriod] = useState("30d")
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [chartType, setChartType] = useState("line") // Default to line chart
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // Estado para o filtro de atendentes
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filteredMetrics, setFilteredMetrics] = useState([])

  // Estado para o gerenciamento de métricas
  const [selectedMetricForEdit, setSelectedMetricForEdit] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isManageMode, setIsManageMode] = useState(false)

  // Função para calcular datas baseadas no período
  const calculateDateRange = (periodValue: string) => {
    const today = new Date()
    let startDate: string
    let newFrom: Date

    switch (periodValue) {
      case "7d":
        newFrom = subDays(today, 7)
        startDate = format(newFrom, "yyyy-MM-dd")
        break
      case "15d":
        newFrom = subDays(today, 15)
        startDate = format(newFrom, "yyyy-MM-dd")
        break
      case "30d":
      default:
        // Usar o início do mês atual ou 30 dias atrás, o que for mais antigo
        const startOfCurrentMonth = startOfMonth(today)
        const thirtyDaysAgo = subDays(today, 30)
        newFrom = startOfCurrentMonth < thirtyDaysAgo ? startOfCurrentMonth : thirtyDaysAgo
        startDate = format(newFrom, "yyyy-MM-dd")
        break
    }

    const endDate = format(today, "yyyy-MM-dd")

    return {
      startDate,
      endDate,
      from: newFrom,
      to: today,
    }
  }

  // Função principal para buscar dados
  const fetchData = async (customStartDate?: string, customEndDate?: string) => {
    setIsLoading(true)
    try {
      console.log("=== INICIANDO BUSCA DE DADOS DOS GRÁFICOS ===")

      const membersData = await getMembers()
      setMembers(membersData)

      let startDate: string
      let endDate: string
      let newDateRange: { from: Date; to: Date }

      // Se datas customizadas foram fornecidas, use-as
      if (customStartDate && customEndDate) {
        startDate = customStartDate
        endDate = customEndDate
        newDateRange = {
          from: new Date(customStartDate),
          to: new Date(customEndDate),
        }
        console.log(`Usando período customizado: ${startDate} até ${endDate}`)
      } else {
        // Calcular baseado no período selecionado
        const calculated = calculateDateRange(period)
        startDate = calculated.startDate
        endDate = calculated.endDate
        newDateRange = {
          from: calculated.from,
          to: calculated.to,
        }
        console.log(`Usando período ${period}: ${startDate} até ${endDate}`)
      }

      // Atualizar o estado do dateRange
      setDateRange(newDateRange)

      // Informações de debug
      let debugText = `Período: ${period}\n`
      debugText += `Data inicial: ${startDate}\n`
      debugText += `Data final: ${endDate}\n`

      // Buscar métricas para o período especificado
      console.log(`Buscando métricas de ${startDate} até ${endDate}`)
      const metricsData = await getMetrics(startDate, endDate)
      debugText += `Métricas recebidas: ${metricsData.length}\n`

      if (metricsData.length === 0) {
        console.log("⚠️ Nenhuma métrica encontrada para o período")
        debugText += "⚠️ Nenhuma métrica encontrada para o período\n"
      }

      // Adicionar nome do membro a cada métrica
      const metricsWithMemberNames = metricsData.map((metric) => {
        const member = membersData.find((m) => m.id === metric.member_id)
        return {
          ...metric,
          member: member?.name || "Desconhecido",
        }
      })

      // Adicionar informações sobre as datas das métricas para debug
      if (metricsWithMemberNames.length > 0) {
        const dates = metricsWithMemberNames.map((m) => m.date).sort()
        debugText += `Datas das métricas: ${dates[0]} até ${dates[dates.length - 1]}\n`

        // Log dos membros únicos encontrados
        const uniqueMembersFound = Array.from(
          new Set(metricsWithMemberNames.map((item) => item.member || "Desconhecido")),
        )
        debugText += `Membros encontrados: ${uniqueMembersFound.join(", ")}\n`
        debugText += `Total de registros por membro:\n`

        uniqueMembersFound.forEach((member) => {
          const count = metricsWithMemberNames.filter((m) => m.member === member).length
          debugText += `  ${member}: ${count} registros\n`
        })
      }

      setDebugInfo(debugText)
      setMetrics(metricsWithMemberNames)

      // Inicializar o estado de seleção de membros - TODOS selecionados por padrão
      const uniqueMembers = Array.from(new Set(metricsWithMemberNames.map((item) => item.member || "Desconhecido")))

      console.log("Membros únicos encontrados:", uniqueMembers)

      // Sempre inicializar com TODOS os membros selecionados
      const initialMemberState = {}
      uniqueMembers.forEach((member) => {
        initialMemberState[member] = true
      })

      console.log("Estado inicial dos membros:", initialMemberState)
      setSelectedMembers(initialMemberState)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Effect para carregar dados iniciais e quando o período mudar
  useEffect(() => {
    console.log(`Período alterado para: ${period}`)
    fetchData()
  }, [period, selectedMetric])

  // Efeito para filtrar métricas com base nos atendentes selecionados
  useEffect(() => {
    console.log("=== FILTRO DE MÉTRICAS ===")
    console.log("Total de métricas:", metrics.length)
    console.log("Estado dos membros selecionados:", selectedMembers)

    if (metrics.length === 0) {
      setFilteredMetrics([])
      return
    }

    // Se nenhum atendente estiver selecionado, mostrar todos
    const hasSelectedMembers = Object.values(selectedMembers).some((selected) => selected)
    console.log("Tem membros selecionados:", hasSelectedMembers)

    if (!hasSelectedMembers) {
      console.log("Nenhum membro selecionado, mostrando todos")
      setFilteredMetrics(metrics)
      return
    }

    // Filtrar métricas pelos atendentes selecionados
    const filtered = metrics.filter((metric) => {
      const memberName = metric.member || "Desconhecido"
      const isSelected = selectedMembers[memberName]
      return isSelected
    })

    console.log("Métricas filtradas:", filtered.length)
    setFilteredMetrics(filtered)
  }, [metrics, selectedMembers])

  const handleRefresh = async () => {
    setIsRefreshing(true)

    // Se estiver usando período customizado, manter as datas
    if (period === "custom") {
      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      await fetchData(startDate, endDate)
    } else {
      await fetchData()
    }

    toast({
      title: "Dados atualizados",
      description: "Os dados foram atualizados com sucesso.",
    })
  }

  const handleCustomDateFilter = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Período inválido",
        description: "Selecione uma data de início e fim válidas.",
        variant: "destructive",
      })
      return
    }

    setPeriod("custom")
    setIsCalendarOpen(false)

    // Usar as datas selecionadas no calendário para filtrar
    const startDate = format(dateRange.from, "yyyy-MM-dd")
    const endDate = format(dateRange.to, "yyyy-MM-dd")

    console.log(`Aplicando filtro customizado: ${startDate} até ${endDate}`)
    await fetchData(startDate, endDate)
  }

  // Função para alterar período
  const handlePeriodChange = (newPeriod: string) => {
    console.log(`Alterando período de ${period} para ${newPeriod}`)
    setPeriod(newPeriod)

    // Se não for customizado, atualizar o dateRange automaticamente
    if (newPeriod !== "custom") {
      const calculated = calculateDateRange(newPeriod)
      setDateRange({
        from: calculated.from,
        to: calculated.to,
      })
    }
  }

  // Determinar o tipo de gráfico com base na métrica selecionada
  useEffect(() => {
    if (selectedMetric === "average_response_time" || selectedMetric === "resolution_rate") {
      setChartType("line")
    } else {
      setChartType("pie")
    }
  }, [selectedMetric])

  const metricOptions = [
    { value: "resolution_rate", label: "Taxa de Resolução" },
    { value: "average_response_time", label: "Tempo Médio" },
    { value: "evaluated_percentage", label: "% Avaliados" },
    { value: "csat_score", label: "CSAT" },
  ]

  // Configurações específicas para cada tipo de métrica
  const getMetricConfig = (metricType) => {
    switch (metricType) {
      case "average_response_time":
        return {
          referenceValue: 40,
          referenceLabel: "Meta: 40 min",
          yAxisFormatter: (value) => `${value} min`,
          tooltipFormatter: (value) => `${value.toFixed(1)} min`,
          domain: [0, "auto"],
        }
      case "resolution_rate":
        return {
          referenceValue: 90,
          referenceLabel: "Meta: 90%",
          yAxisFormatter: (value) => `${value}%`,
          tooltipFormatter: (value) => `${value.toFixed(1)}%`,
          domain: [0, 100],
        }
      default:
        return {}
    }
  }

  const metricConfig = getMetricConfig(selectedMetric)

  // Função para alternar a seleção de todos os atendentes
  const toggleAllMembers = (selected: boolean) => {
    const newState = { ...selectedMembers }
    Object.keys(newState).forEach((member) => {
      newState[member] = selected
    })
    setSelectedMembers(newState)
  }

  // Função para alternar a visibilidade de um membro quando clicado na legenda
  const handleMemberToggle = (member: string) => {
    setSelectedMembers((prev) => ({
      ...prev,
      [member]: !prev[member],
    }))
  }

  // Contar quantos atendentes estão selecionados
  const selectedCount = Object.values(selectedMembers).filter(Boolean).length
  const totalMembers = Object.keys(selectedMembers).length

  // Funções para gerenciamento de métricas
  const handleEditMetric = (metric) => {
    setSelectedMetricForEdit(metric)
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setSelectedMetricForEdit(null)
  }

  const handleEditSuccess = () => {
    // Recarregar dados após edição
    if (period === "custom") {
      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      fetchData(startDate, endDate)
    } else {
      fetchData()
    }

    toast({
      title: "Métrica atualizada",
      description: "A métrica foi atualizada com sucesso.",
    })
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }

  // Função para formatar tempo médio
  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}min`
    }
    return `${minutes} min`
  }

  // Função para exportar métricas
  const handleExportMetrics = () => {
    try {
      if (!filteredMetrics.length) {
        toast({
          title: "Sem dados para exportar",
          description: "Não há dados disponíveis para exportação.",
          variant: "destructive",
        })
        return
      }

      const fileName = "metricas_suporte"
      const result = exportToCSV(filteredMetrics, fileName)

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

  // Função para obter o texto do período atual
  const getCurrentPeriodText = () => {
    if (period === "custom") {
      return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`
    }

    switch (period) {
      case "7d":
        return "Últimos 7 dias"
      case "15d":
        return "Últimos 15 dias"
      case "30d":
        return "Últimos 30 dias"
      default:
        return "Período selecionado"
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 bg-[#0056D6] text-white">
        <h1 className="text-2xl font-bold text-white">Gráficos - Suporte</h1>
        <p className="text-sm text-white/90">Visualização gráfica das métricas de suporte - {getCurrentPeriodText()}</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>Selecione o período e a métrica para visualização</CardDescription>
              </div>
              <div className="flex gap-2">
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="relative">
                      <Filter className="h-4 w-4 mr-2" />
                      Atendentes
                      {selectedCount < totalMembers && selectedCount > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1">
                          {selectedCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0" align="end">
                    <div className="p-2 flex items-center justify-between border-b">
                      <span className="text-sm font-medium">Filtrar por atendente</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFilterOpen(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px] p-2">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 px-1 py-1">
                          <Checkbox
                            id="select-all"
                            checked={selectedCount === totalMembers}
                            onCheckedChange={(checked) => toggleAllMembers(!!checked)}
                          />
                          <label
                            htmlFor="select-all"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Selecionar todos
                          </label>
                        </div>

                        <div className="pt-1 pb-1">
                          <div className="h-px bg-muted" />
                        </div>

                        {Object.keys(selectedMembers)
                          .sort()
                          .map((member) => (
                            <div key={member} className="flex items-center space-x-2 px-1 py-1">
                              <Checkbox
                                id={`member-${member}`}
                                checked={selectedMembers[member]}
                                onCheckedChange={(checked) => {
                                  setSelectedMembers((prev) => ({
                                    ...prev,
                                    [member]: !!checked,
                                  }))
                                }}
                              />
                              <label
                                htmlFor={`member-${member}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {member}
                              </label>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                    <div className="p-2 border-t flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => toggleAllMembers(false)}>
                        Limpar
                      </Button>
                      <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                        Aplicar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Atualizar dados"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="relative">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs whitespace-pre-wrap max-w-xs">
                        {debugInfo || "Nenhuma informação de debug disponível"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">Métrica</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma métrica" />
                  </SelectTrigger>
                  <SelectContent>
                    {metricOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Tabs value={period} onValueChange={handlePeriodChange} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="7d" className="flex-1">
                      7 dias
                    </TabsTrigger>
                    <TabsTrigger value="15d" className="flex-1">
                      15 dias
                    </TabsTrigger>
                    <TabsTrigger value="30d" className="flex-1">
                      30 dias
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">Período personalizado</label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                      locale={ptBR}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <Button size="sm" className="w-full" onClick={handleCustomDateFilter}>
                        Aplicar Filtro
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renderizar o tipo de gráfico apropriado com base na métrica selecionada */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedMetric === "average_response_time"
                ? "Tempo Médio de Resposta"
                : selectedMetric === "resolution_rate"
                  ? "Taxa de Resolução"
                  : "Comparação por Atendente"}
            </CardTitle>
            <CardDescription>
              {metricOptions.find((option) => option.value === selectedMetric)?.label || selectedMetric}
              {selectedMetric === "average_response_time" || selectedMetric === "resolution_rate"
                ? " ao longo do tempo"
                : " médio por atendente"}
              {selectedCount < totalMembers && (
                <span className="ml-2">
                  (Filtrado: {selectedCount} de {totalMembers} atendentes)
                </span>
              )}
              <span className="ml-2 text-muted-foreground">• {getCurrentPeriodText()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {selectedMetric === "average_response_time" || selectedMetric === "resolution_rate" ? (
              <MetricsLineChart
                metrics={filteredMetrics}
                isLoading={isLoading}
                metricType={selectedMetric}
                referenceValue={metricConfig.referenceValue}
                referenceLabel={metricConfig.referenceLabel}
                yAxisFormatter={metricConfig.yAxisFormatter}
                tooltipFormatter={metricConfig.tooltipFormatter}
                domain={metricConfig.domain}
                onMemberToggle={handleMemberToggle}
              />
            ) : (
              <MetricsPieChart
                metrics={filteredMetrics}
                isLoading={isLoading}
                metricType={selectedMetric}
                onMemberToggle={handleMemberToggle}
              />
            )}
          </CardContent>
        </Card>

        {/* Gerenciamento de métricas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Métricas</CardTitle>
              <CardDescription>
                Total de métricas carregadas: {metrics.length} • {getCurrentPeriodText()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsManageMode(!isManageMode)}
                className={isManageMode ? "bg-gray-200" : ""}
              >
                <Edit className="mr-2 h-4 w-4" />
                {isManageMode ? "Voltar" : "Gerenciar Métricas"}
              </Button>
              <Button variant="outline" onClick={handleExportMetrics} disabled={!metrics.length}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isManageMode ? (
              // Modo de gerenciamento de métricas
              isLoading ? (
                <div className="text-center py-8">Carregando métricas...</div>
              ) : metrics.length === 0 ? (
                <div className="text-center py-8">
                  <p>Nenhuma métrica encontrada para os filtros selecionados.</p>
                  <p className="text-sm text-muted-foreground mt-2">Período: {getCurrentPeriodText()}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Data
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Membro
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Taxa de Resolução
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tempo Médio
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            CSAT
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            % Avaliados
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMetrics.map((metric) => (
                          <tr key={metric.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatDate(metric.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.member}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {metric.resolution_rate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTime(metric.average_response_time)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metric.csat_score}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {metric.evaluated_percentage}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditMetric(metric)}
                                title="Editar métrica"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              // Modo de visualização resumida
              <div className="text-center py-8">
                <p>Clique em "Gerenciar Métricas" para visualizar e editar as métricas disponíveis.</p>
                <p className="text-sm text-muted-foreground mt-2">{getCurrentPeriodText()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedMetricForEdit && (
        <EditMetricDialog
          isOpen={isEditDialogOpen}
          onClose={closeEditDialog}
          metric={selectedMetricForEdit}
          onSuccess={handleEditSuccess}
        />
      )}

      <Toaster />
    </div>
  )
}
