"use client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search } from "lucide-react"
import { MetricsStats } from "@/components/dashboard/metrics-stats"
import { SupportStats } from "@/components/support/support-stats"
import { useState, useEffect } from "react"
import { getMetrics } from "@/lib/data-service"
import { getSupportMetrics } from "@/lib/support-metrics-service"
import { runDiagnostics } from "@/lib/diagnostics-service"
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

      console.log(`🔄 Buscando dados de suporte de ${startDate} até ${endDate}`)

      // Buscar métricas gerais
      const metricsData = await getMetrics(startDate, endDate)
      console.log(`📊 Fetched ${metricsData.length} metrics for support dashboard`)
      setMetrics(metricsData)

      // Buscar métricas calculadas de suporte
      const supportMetricsData = await getSupportMetrics(startDate, endDate)
      console.log("📈 Support metrics calculated:", supportMetricsData)
      setSupportMetrics(supportMetricsData)
    } catch (error) {
      console.error("❌ Error fetching data:", error)
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

  const handleDiagnostics = async () => {
    console.log("🔍 Executando diagnóstico completo...")
    await runDiagnostics()
    toast({
      title: "Diagnóstico executado",
      description: "Verifique o console para ver os resultados detalhados.",
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho com faixa azul e texto branco */}
      <div className="p-6 bg-[#0056D6] text-white">
        <h1 className="text-2xl font-bold text-white">Visão Geral - Suporte</h1>
        <p className="text-sm text-white/90">Resumo das principais métricas de atendimento</p>
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

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleDiagnostics} title="Executar diagnóstico completo">
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Atualizar dados"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Cards de métricas de suporte calculadas */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Métricas Principais</h2>
          <SupportStats stats={supportMetrics} isLoading={isLoading} />
        </div>

        {/* Métricas detalhadas existentes */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Métricas Detalhadas</h2>
          <MetricsStats metrics={metrics} isLoading={isLoading} />
        </div>
      </div>
      <Toaster />
    </div>
  )
}
