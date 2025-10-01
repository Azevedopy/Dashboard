"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, TrendingUp, Clock, Users, CheckCircle, AlertCircle } from "lucide-react"
import { getMetrics, getMembers } from "@/lib/data-service"
import { toast } from "sonner"

interface MetricData {
  id: string
  member_id: string
  member: string
  date: string
  resolution_rate: number
  average_response_time: number
  csat_score: number
  evaluated_percentage: number
  open_tickets: number
  resolved_tickets: number
  service_type: string
}

interface Member {
  id: string
  name: string
  service_type: string
  email: string
}

export default function SuporteVisaoGeral() {
  const [metrics, setMetrics] = useState<MetricData[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("30")
  const [selectedMember, setSelectedMember] = useState<string>("all")

  // Função para buscar dados
  const fetchData = async (showToast = false) => {
    try {
      setRefreshing(true)

      if (showToast) {
        toast.info("Atualizando dados...")
      }

      console.log("🔄 Iniciando busca de dados...")

      // Calcular datas baseado no período selecionado
      const endDate = new Date().toISOString().split("T")[0]
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - Number.parseInt(selectedPeriod))
      const startDateString = startDate.toISOString().split("T")[0]

      console.log(`📅 Período: ${startDateString} até ${endDate}`)

      // Buscar métricas e membros em paralelo
      const [metricsData, membersData] = await Promise.all([
        getMetrics(startDateString, endDate, selectedMember !== "all" ? [selectedMember] : undefined, "suporte"),
        getMembers("suporte"),
      ])

      console.log(`📊 Dados obtidos: ${metricsData.length} métricas, ${membersData.length} membros`)

      setMetrics(metricsData)
      setMembers(membersData)

      if (showToast) {
        toast.success(`Dados atualizados! ${metricsData.length} registros carregados.`)
      }
    } catch (error) {
      console.error("❌ Erro ao buscar dados:", error)
      toast.error("Erro ao carregar dados. Usando dados de demonstração.")

      // Em caso de erro, manter dados existentes ou usar dados vazios
      if (metrics.length === 0) {
        setMetrics([])
        setMembers([])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    fetchData()
  }, [selectedPeriod, selectedMember])

  // Calcular estatísticas
  const calculateStats = () => {
    if (metrics.length === 0) {
      return {
        avgResolutionRate: 0,
        avgResponseTime: 0,
        avgCSAT: 0,
        totalTickets: 0,
        resolvedTickets: 0,
        openTickets: 0,
        evaluatedPercentage: 0,
      }
    }

    const totalMetrics = metrics.length

    return {
      avgResolutionRate: Math.round(metrics.reduce((sum, m) => sum + (m.resolution_rate || 0), 0) / totalMetrics),
      avgResponseTime: Math.round(metrics.reduce((sum, m) => sum + (m.average_response_time || 0), 0) / totalMetrics),
      avgCSAT: Math.round(metrics.reduce((sum, m) => sum + (m.csat_score || 0), 0) / totalMetrics),
      totalTickets: metrics.reduce((sum, m) => sum + (m.open_tickets || 0) + (m.resolved_tickets || 0), 0),
      resolvedTickets: metrics.reduce((sum, m) => sum + (m.resolved_tickets || 0), 0),
      openTickets: metrics.reduce((sum, m) => sum + (m.open_tickets || 0), 0),
      evaluatedPercentage: Math.round(
        metrics.reduce((sum, m) => sum + (m.evaluated_percentage || 0), 0) / totalMetrics,
      ),
    }
  }

  const stats = calculateStats()

  // Função para determinar cor do badge baseado no valor
  const getBadgeVariant = (value: number, type: "rate" | "time" | "score") => {
    switch (type) {
      case "rate":
      case "score":
        return value >= 90 ? "default" : value >= 70 ? "secondary" : "destructive"
      case "time":
        return value <= 60 ? "default" : value <= 120 ? "secondary" : "destructive"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-lg">Carregando dados...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Visão Geral - Suporte</h1>
          <p className="text-muted-foreground">Acompanhe as métricas de desempenho da equipe de suporte</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Filtro de Período */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de Membro */}
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os membros</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botão de Atualizar */}
          <Button onClick={() => fetchData(true)} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {metrics.length > 0 ? `${metrics.length} registros carregados` : "Dados de demonstração"}
        </Badge>
        {selectedMember !== "all" && (
          <Badge variant="secondary">Filtrado por: {members.find((m) => m.id === selectedMember)?.name}</Badge>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taxa de Resolução */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.avgResolutionRate}%</div>
              <Badge variant={getBadgeVariant(stats.avgResolutionRate, "rate")}>
                {stats.avgResolutionRate >= 90 ? "Excelente" : stats.avgResolutionRate >= 70 ? "Bom" : "Atenção"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Média dos últimos {selectedPeriod} dias</p>
          </CardContent>
        </Card>

        {/* Tempo Médio de Resposta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.avgResponseTime}min</div>
              <Badge variant={getBadgeVariant(stats.avgResponseTime, "time")}>
                {stats.avgResponseTime <= 60 ? "Rápido" : stats.avgResponseTime <= 120 ? "Médio" : "Lento"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Tempo para primeira resposta</p>
          </CardContent>
        </Card>

        {/* CSAT Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CSAT Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.avgCSAT}%</div>
              <Badge variant={getBadgeVariant(stats.avgCSAT, "score")}>
                {stats.avgCSAT >= 90 ? "Excelente" : stats.avgCSAT >= 70 ? "Bom" : "Atenção"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Satisfação do cliente</p>
          </CardContent>
        </Card>

        {/* Total de Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {stats.resolvedTickets} resolvidos
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-orange-500" />
                {stats.openTickets} abertos
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo da Equipe */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Equipe</CardTitle>
            <CardDescription>Informações sobre a equipe de suporte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Membros Ativos</span>
                <Badge variant="outline">{members.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Período Analisado</span>
                <Badge variant="secondary">{selectedPeriod} dias</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">% Avaliado</span>
                <Badge variant={getBadgeVariant(stats.evaluatedPercentage, "score")}>
                  {stats.evaluatedPercentage}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>Informações sobre a conexão e dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Conexão</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Online
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Última Atualização</span>
                <span className="text-sm text-muted-foreground">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Registros</span>
                <Badge variant="secondary">{metrics.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
