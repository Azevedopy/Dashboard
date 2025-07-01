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
  const [isPreview] = useState(typeof window !== "undefined" && window.location.hostname.includes("v0.dev"))

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

      console.log(`🔄 Buscando dados de suporte de ${startDate} até ${endDate} (${period})`)

      try {
        // Buscar métricas calculadas de suporte COM FILTRO DE DATA
        console.log("📈 Iniciando busca de métricas de suporte...")
        const supportMetricsData = await getSupportMetrics(startDate, endDate)
        console.log("📈 Support metrics calculated for period:", supportMetricsData)
        setSupportMetrics(supportMetricsData)

        // Buscar métricas gerais com filtro de data
        console.log("📊 Iniciando busca de métricas gerais...")
        const metricsData = await getMetrics(startDate, endDate)
        console.log(`📊 Fetched ${metricsData.length} metrics for support dashboard (${period})`)
        setMetrics(metricsData)

        // Mostrar toast de sucesso apenas se não estivermos em preview
        if (!isPreview) {
          toast({
            title: "Dados carregados com sucesso",
            description: `Métricas atualizadas para o período de ${period.replace("d", " dias")}.`,
          })
        }
      } catch (fetchError) {
        console.error("❌ Error fetching specific data:", fetchError)

        // Em caso de erro, ainda definir dados padrão para evitar erros de renderização
        setSupportMetrics(null)
        setMetrics([])

        toast({
          title: "Erro ao carregar dados",
          description: isPreview
            ? "Dados de demonstração carregados para ambiente de preview."
            : "Alguns dados podem estar incompletos. Verifique sua conexão.",
          variant: isPreview ? "default" : "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error in overall fetch process:", error)

      // Definir dados vazios para evitar erros de renderização
      setMetrics([])
      setSupportMetrics(null)

      toast({
        title: "Erro ao carregar dados",
        description: isPreview
          ? "Dados de demonstração carregados para ambiente de preview."
          : "Não foi possível carregar os dados. Tente novamente mais tarde.",
        variant: isPreview ? "default" : "destructive",
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
      description: `Os dados foram atualizados para o período selecionado (${period}).`,
    })
  }

  const handleDiagnostics = async () => {
    if (isPreview) {
      toast({
        title: "Diagnóstico simulado",
        description: "Em ambiente de preview, os diagnósticos são apenas simulados.",
      })
      return
    }

    try {
      console.log("🔍 Executando diagnóstico completo...")
      await runDiagnostics()
      toast({
        title: "Diagnóstico executado",
        description: "Verifique o console para ver os resultados detalhados.",
      })
    } catch (error) {
      console.error("❌ Erro ao executar diagnóstico:", error)
      toast({
        title: "Erro no diagnóstico",
        description: "Não foi possível executar o diagnóstico completo.",
        variant: "destructive",
      })
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "7d":
        return "últimos 7 dias"
      case "15d":
        return "últimos 15 dias"
      case "30d":
      default:
        return "últimos 30 dias"
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho com faixa azul e texto branco */}
      <div className="p-6 bg-[#0056D6] text-white">
        <h1 className="text-2xl font-bold text-white">Visão Geral - Suporte</h1>
        <p className="text-sm text-white/90">
          {isPreview && "(MODO PREVIEW) "}Resumo das principais métricas de atendimento - {getPeriodLabel()}
        </p>
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
