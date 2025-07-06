"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Download, RefreshCw, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CompletedConsultingStats } from "@/components/consulting/completed-consulting-stats"
import { CompletedConsultingTable } from "@/components/consulting/completed-consulting-table"
import { ConsultantCommissionChart } from "@/components/consulting/consultant-commission-chart"
import { cn } from "@/lib/utils"
import { exportCompletedConsultingReport } from "@/lib/export-utils"
import { toast } from "@/components/ui/use-toast"
import {
  getCompletedConsultingProjects,
  getCompletedConsultingStats,
  getCompletedConsultores,
} from "@/lib/completed-consulting-service"
import type { ConsultingProject, ConsultingStats } from "@/lib/types"

export default function ConsultoriasConcluidasPage() {
  const [projects, setProjects] = useState<ConsultingProject[]>([])
  const [stats, setStats] = useState<ConsultingStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageRating: 0,
    totalRevenue: 0,
    averageProjectDuration: 0,
    deadlineComplianceRate: 0,
  })
  const [consultores, setConsultores] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  // Verificar se estamos em ambiente de preview
  const isPreview =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") || window.location.hostname === "localhost")

  useEffect(() => {
    async function fetchData() {
      console.log("🔄 Iniciando carregamento dos dados...")
      setIsLoading(true)
      setError(null)

      try {
        // Preparar filtros
        const filters: {
          startDate?: string
          endDate?: string
        } = {}

        if (dateRange.from) {
          filters.startDate = format(dateRange.from, "yyyy-MM-dd")
        }
        if (dateRange.to) {
          filters.endDate = format(dateRange.to, "yyyy-MM-dd")
        }

        console.log("🔍 Aplicando filtros:", filters)

        // Buscar dados em paralelo
        const [projectsData, statsData, consultoresData] = await Promise.all([
          getCompletedConsultingProjects(filters),
          getCompletedConsultingStats(filters),
          getCompletedConsultores(),
        ])

        console.log("✅ Dados carregados com sucesso:", {
          projetos: projectsData?.length || 0,
          consultores: consultoresData?.length || 0,
          stats: statsData,
        })

        setProjects(Array.isArray(projectsData) ? projectsData : [])
        setStats(statsData || stats)
        setConsultores(Array.isArray(consultoresData) ? consultoresData : [])

        // Toast de sucesso apenas se não estivermos no carregamento inicial
        if (!isLoading) {
          toast({
            title: "✅ Dados atualizados",
            description: `${projectsData?.length || 0} consultorias encontradas`,
          })
        }
      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error)
        setError("Não foi possível carregar os dados das consultorias")

        toast({
          title: "❌ Erro ao carregar dados",
          description: "Usando dados de demonstração",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const handleExport = () => {
    try {
      if (!projects || projects.length === 0) {
        toast({
          title: "⚠️ Aviso",
          description: "Não há dados para exportar",
        })
        return
      }

      if (isPreview) {
        toast({
          title: "🚀 Modo Demonstração",
          description: "A exportação não está disponível no modo preview.",
        })
      } else {
        exportCompletedConsultingReport(projects, stats)
        toast({
          title: "✅ Relatório exportado",
          description: "Relatório completo de consultorias concluídas baixado com sucesso",
        })
      }
    } catch (error) {
      console.error("❌ Erro ao exportar:", error)
      toast({
        title: "❌ Erro na exportação",
        description: "Não foi possível exportar o relatório",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    // Forçar recarregamento alterando o estado de dateRange
    setDateRange({ ...dateRange })
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">Consultorias Concluídas</h2>
            {isPreview && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                DEMONSTRAÇÃO
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Visualize e analise todas as consultorias que foram concluídas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground",
                )}
              >
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
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Separator />

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}. {isPreview ? "Exibindo dados de demonstração." : "Tente recarregar a página."}
          </AlertDescription>
        </Alert>
      )}

      <CompletedConsultingStats stats={stats} isLoading={isLoading} />

      <Tabs defaultValue="projetos">
        <TabsList>
          <TabsTrigger value="projetos">Projetos ({projects?.length || 0})</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões ({consultores?.length || 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="projetos" className="space-y-4">
          <CompletedConsultingTable projects={projects} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="comissoes" className="space-y-4">
          <ConsultantCommissionChart
            consultores={consultores}
            startDate={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined}
            endDate={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
