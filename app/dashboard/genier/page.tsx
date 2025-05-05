"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, subDays } from "date-fns"
import { pt } from "date-fns/locale"
import { CalendarIcon, BarChart, LineChart, HelpCircle, FileText, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getSupabase } from "@/lib/supabase"

export default function GenierDashboardPage() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const supabase = getSupabase()
        let startDate

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

        const endDate = format(new Date(), "yyyy-MM-dd")

        const { data, error } = await supabase
          .from("metrics_genier")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false })

        if (error) {
          console.error("Error fetching metrics_genier data:", error)
          return
        }

        setMetrics(data || [])
      } catch (error) {
        console.error("Unexpected error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period, refreshKey])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleFilter = () => {
    setIsCalendarOpen(false)
    setPeriod("custom")
  }

  // Calcular estatísticas
  const totalArticles = metrics.reduce((sum, item) => sum + (item.articles_published || 0), 0)
  const totalAttendances = metrics.reduce((sum, item) => sum + (item.virtual_agent_attendances || 0), 0)
  const resolvedAttendances = metrics.reduce((sum, item) => sum + (item.virtual_agent_resolved || 0), 0)
  const unresolvedAttendances = metrics.reduce((sum, item) => sum + (item.virtual_agent_unresolved || 0), 0)

  // Obter lista de materiais faltantes únicos
  const missingMaterialsSet = new Set<string>()
  metrics.forEach((item) => {
    if (item.missing_materials && Array.isArray(item.missing_materials)) {
      item.missing_materials.forEach((material: string) => {
        missingMaterialsSet.add(material)
      })
    } else if (item.missing_materials && typeof item.missing_materials === "object") {
      Object.values(item.missing_materials).forEach((material: any) => {
        if (typeof material === "string") {
          missingMaterialsSet.add(material)
        }
      })
    }
  })
  const uniqueMissingMaterials = Array.from(missingMaterialsSet)

  // Dados para o gráfico de atendimentos
  const attendanceData = metrics
    .map((item) => ({
      date: item.date,
      total: item.virtual_agent_attendances || 0,
      resolved: item.virtual_agent_resolved || 0,
      unresolved: item.virtual_agent_unresolved || 0,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Genier</h1>
          <p className="text-sm text-gray-400">Resumo das principais métricas e atividades do Genier</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-auto bg-gray-900 border-gray-700">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="15d">Últimos 15 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="custom">Período personalizado</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-gray-900 border-gray-700">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Selecione um período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                  locale={pt}
                  initialFocus
                  className="bg-gray-900"
                />
                <div className="flex justify-end p-2">
                  <Button size="sm" onClick={handleFilter}>
                    Aplicar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button variant="outline" size="icon" onClick={handleRefresh} className="bg-gray-900 border-gray-700">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Cartões de Métricas */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-32 bg-gray-800" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-16 bg-gray-800" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-400 text-sm font-normal flex items-center justify-between">
                    Total de Artigos Publicados
                    <BarChart className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalArticles}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-400 text-sm font-normal flex items-center justify-between">
                    Total de Atendimentos
                    <FileText className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalAttendances}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-400 text-sm font-normal flex items-center justify-between">
                    Atendimentos Resolvidos
                    <LineChart className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{resolvedAttendances}</div>
                  <div className="text-sm text-gray-400">
                    {totalAttendances > 0
                      ? `${((resolvedAttendances / totalAttendances) * 100).toFixed(1)}% do total`
                      : "0% do total"}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-400 text-sm font-normal flex items-center justify-between">
                    Materiais Faltantes
                    <HelpCircle className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{uniqueMissingMaterials.length}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Abas para diferentes visualizações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="attendances">Atendimentos</TabsTrigger>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
            <TabsTrigger value="details">Dados Detalhados</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-200">Artigos Publicados por Data</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {isLoading ? (
                    <Skeleton className="h-full w-full bg-gray-800" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Gráfico de Artigos Publicados
                      {/* Aqui seria implementado o gráfico de artigos */}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-200">Atendimentos vs. Resolução</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {isLoading ? (
                    <Skeleton className="h-full w-full bg-gray-800" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Gráfico de Atendimentos vs. Resolução
                      {/* Aqui seria implementado o gráfico de atendimentos */}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendances" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">Detalhamento de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-80 w-full bg-gray-800" />
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-400">
                    Gráfico Detalhado de Atendimentos
                    {/* Aqui seria implementado o gráfico detalhado */}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">Estatísticas de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Total de Atendimentos</div>
                    <div className="text-2xl font-bold">{totalAttendances}</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Atendimentos Resolvidos</div>
                    <div className="text-2xl font-bold">{resolvedAttendances}</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-gray-400 text-sm mb-1">Atendimentos Não Resolvidos</div>
                    <div className="text-2xl font-bold">{unresolvedAttendances}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">Lista de Materiais Faltantes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-8 w-full bg-gray-800" />
                    ))}
                  </div>
                ) : uniqueMissingMaterials.length > 0 ? (
                  <ul className="space-y-2">
                    {uniqueMissingMaterials.map((material, index) => (
                      <li key={index} className="p-2 bg-gray-800 rounded flex items-center">
                        <HelpCircle className="h-4 w-4 mr-2 text-amber-500" />
                        <span>{material}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum material faltante registrado no período selecionado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">Dados Detalhados</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-gray-800" />
                    ))}
                  </div>
                ) : metrics.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left p-2">Data</th>
                          <th className="text-right p-2">Artigos</th>
                          <th className="text-right p-2">Atendimentos</th>
                          <th className="text-right p-2">Resolvidos</th>
                          <th className="text-right p-2">Não Resolvidos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.map((item, index) => (
                          <tr key={index} className="border-b border-gray-800">
                            <td className="p-2">{format(new Date(item.date), "dd/MM/yyyy")}</td>
                            <td className="text-right p-2">{item.articles_published || 0}</td>
                            <td className="text-right p-2">{item.virtual_agent_attendances || 0}</td>
                            <td className="text-right p-2">{item.virtual_agent_resolved || 0}</td>
                            <td className="text-right p-2">{item.virtual_agent_unresolved || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum dado encontrado para o período selecionado.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
