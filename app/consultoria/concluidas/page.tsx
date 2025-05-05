"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompletedConsultingStats } from "@/components/consulting/completed-consulting-stats"
import { CompletedConsultingTable } from "@/components/consulting/completed-consulting-table"
import { ConsultantCommissionChart } from "@/components/consulting/consultant-commission-chart"
import { cn } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
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
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
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

        // Buscar dados
        const [projectsData, statsData, consultoresData] = await Promise.all([
          getCompletedConsultingProjects(filters),
          getCompletedConsultingStats(filters),
          getCompletedConsultores(),
        ])

        setProjects(projectsData)
        setStats(statsData)
        setConsultores(consultoresData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const handleExport = () => {
    const dataToExport = projects.map((project) => ({
      Cliente: project.cliente,
      Tipo: project.tipo,
      Consultor: project.consultor || "Não atribuído",
      "Data de Início": project.data_inicio,
      "Data de Término": project.data_termino,
      "Data de Finalização": project.data_finalizacao,
      "Valor da Consultoria": project.valor_consultoria,
      "Valor da Comissão": project.valor_comissao || 0,
      "Percentual de Comissão": project.percentual_comissao || 0,
      "Avaliação (Estrelas)": project.avaliacao_estrelas || "N/A",
      "Prazo Atingido": project.prazo_atingido ? "Sim" : "Não",
      Status: "Concluído",
    }))

    exportToExcel(dataToExport, "consultorias_concluidas")
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Consultorias Concluídas</h2>
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
            Exportar
          </Button>
        </div>
      </div>
      <Separator />
      <CompletedConsultingStats stats={stats} isLoading={isLoading} />
      <Tabs defaultValue="projetos">
        <TabsList>
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
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
