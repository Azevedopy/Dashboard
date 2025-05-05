"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { MetricsStats } from "@/components/dashboard/metrics-stats"
import { SupportMetricsCards } from "@/components/support/support-metrics-cards"
import { useState, useEffect } from "react"
import { getMetrics } from "@/lib/data-service"
import { getSupportMetrics } from "@/lib/support-metrics-service"
import { format, subDays } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function VisaoGeralPage() {
  const [metrics, setMetrics] = useState([])
  const [supportMetrics, setSupportMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      let startDate
      const endDate = format(new Date(), "yyyy-MM-dd")

      switch (period) {
        case "7d":
          startDate = format(subDays(new Date(), 7), "yyyy-MM-dd")
          break
        case "15d":
          startDate = format(subDays(new Date(), 15), "yyyy-MM-dd")
          break
        case "30d":
        default:
          startDate = format(subDays(new Date(), 30), "yyyy-MM-dd")
          break
      }

      // Buscar métricas gerais (sem filtrar por service_type)
      const metricsData = await getMetrics(startDate, endDate)
      setMetrics(metricsData)

      // Se você tiver implementado getSupportMetrics, atualize também
      if (typeof getSupportMetrics === "function") {
        const supportMetricsData = await getSupportMetrics(startDate, endDate)
        setSupportMetrics(supportMetricsData)
      }
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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast({
      title: "Dados atualizados",
      description: "Os dados foram atualizados com sucesso.",
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Visão Geral - Suporte</h1>
        <p className="text-sm text-muted-foreground">Resumo das principais métricas de atendimento</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Tabs defaultValue={period} onValueChange={setPeriod} value={period}>
            <TabsList>
              <TabsTrigger value="7d">Últimos 7 dias</TabsTrigger>
              <TabsTrigger value="15d">Últimos 15 dias</TabsTrigger>
              <TabsTrigger value="30d">Últimos 30 dias</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} title="Atualizar dados">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Novos cards de métricas de suporte */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Métricas Principais</h2>
          <SupportMetricsCards metrics={supportMetrics} isLoading={isLoading} />
        </div>

        {/* Métricas existentes */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Métricas Detalhadas</h2>
          <MetricsStats metrics={metrics} isLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Atendente</CardTitle>
              <CardDescription>Comparativo de métricas entre atendentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">Dados em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Tickets</CardTitle>
              <CardDescription>Tickets abertos vs. resolvidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">Dados em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
