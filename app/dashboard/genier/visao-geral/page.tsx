"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricsStats } from "@/components/dashboard/metrics-stats"
import { useState, useEffect } from "react"
import { getMetrics } from "@/lib/data-service"
import { format, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function GenierVisaoGeralPage() {
  const [metrics, setMetrics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function fetchData() {
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

        // Buscar apenas métricas do tipo "genier"
        const metricsData = await getMetrics(startDate, endDate)

        // Filtrar apenas as métricas do Genier
        const genierMetrics = metricsData.filter(
          (metric) => metric.member && metric.member.toLowerCase().includes("genier"),
        )

        setMetrics(genierMetrics)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period, refreshKey])

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Visão Geral - Genier</h1>
          <p className="text-sm text-muted-foreground">Resumo das principais métricas do Genier</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="p-6 space-y-6">
        <Tabs defaultValue="30d" onValueChange={setPeriod} value={period}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="7d">Últimos 7 dias</TabsTrigger>
              <TabsTrigger value="15d">Últimos 15 dias</TabsTrigger>
              <TabsTrigger value="30d">Últimos 30 dias</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <MetricsStats metrics={metrics} isLoading={isLoading} />

        <Card>
          <CardHeader>
            <CardTitle>Sobre o Genier</CardTitle>
            <CardDescription>Informações sobre o atendente virtual</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O Genier é nosso atendente virtual que auxilia no suporte aos clientes. As métricas exibidas acima
              refletem seu desempenho no período selecionado. Para cadastrar novas métricas, utilize a página de
              cadastro de métricas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
