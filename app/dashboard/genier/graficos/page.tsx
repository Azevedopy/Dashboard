"use client"

import { useState, useEffect } from "react"
import { format, subDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarIcon,
  Filter,
  PieChart,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Undo2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabase } from "@/lib/supabase"
import { GenierAttendanceChart } from "@/components/dashboard/genier-attendance-chart"
import { GenierArticlesChart } from "@/components/dashboard/genier-articles-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"

// Helper function to validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function GenierGraficosPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState([])
  const [selectedMetric, setSelectedMetric] = useState("articles")
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [processingMaterial, setProcessingMaterial] = useState(null)
  const [publishedMaterials, setPublishedMaterials] = useState([])
  const [materialsView, setMaterialsView] = useState("missing") // "missing" ou "published"
  const itemsPerPage = 10

  const metricOptions = [
    { value: "articles", label: "Artigos Publicados" },
    { value: "attendances", label: "Atendimentos" },
    { value: "materials", label: "Materiais" },
  ]

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const supabase = getSupabase()

        const startDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined
        const endDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined

        // Buscar métricas do Genier diretamente da tabela metrics_genier
        let query = supabase.from("metrics_genier").select("*").order("date", { ascending: true })

        // Only add date filters if the dates are defined
        if (startDate) {
          query = query.gte("date", startDate)
        }

        if (endDate) {
          query = query.lte("date", endDate)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching Genier metrics:", error)
          toast({
            title: "Erro ao carregar métricas",
            description: "Não foi possível carregar as métricas do Genier.",
            variant: "destructive",
            duration: 3000,
          })
          return
        }

        setMetrics(data || [])
        setCurrentPage(1) // Reset to first page when data changes

        // Buscar materiais publicados
        const { data: publishedData, error: publishedError } = await supabase
          .from("published_materials")
          .select("*")
          .is("restored_at", null)
          .order("published_at", { ascending: false })

        if (!publishedError && publishedData) {
          // Preserve temporary published materials (client-side only)
          const tempMaterials = publishedMaterials.filter((m) => m.id.toString().startsWith("temp-"))

          // Merge database materials with temporary ones, avoiding duplicates
          const mergedMaterials = [...tempMaterials]

          // Add database materials that don't have a temporary version
          publishedData.forEach((dbMaterial) => {
            // Check if we already have a temporary version of this material
            const hasTempVersion = tempMaterials.some((tempMat) => tempMat.material_name === dbMaterial.material_name)

            if (!hasTempVersion) {
              mergedMaterials.push(dbMaterial)
            }
          })

          setPublishedMaterials(mergedMaterials)

          // Log for debugging
          console.log(
            `Synchronized ${publishedData.length} database materials with ${tempMaterials.length} temporary materials`,
          )
        } else {
          console.error("Error fetching published materials:", publishedError)
          // Keep any existing temporary materials
          const tempMaterials = publishedMaterials.filter((m) => m.id.toString().startsWith("temp-"))
          if (tempMaterials.length > 0) {
            setPublishedMaterials(tempMaterials)
          } else {
            setPublishedMaterials([])
          }
        }

        // Update missing materials based on what's already published
        updateMissingMaterialsList()
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao sincronizar os dados com o banco.",
          variant: "destructive",
          duration: 3000,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange, refreshKey])

  const handleFilter = () => {
    setIsCalendarOpen(false)
  }

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
  }

  // Preparar dados para os gráficos
  const attendanceData = metrics.map((metric) => ({
    date: metric.date,
    total: metric.virtual_agent_attendances || 0,
    resolved: metric.virtual_agent_resolved || 0,
    unresolved: metric.virtual_agent_unresolved || 0,
  }))

  const articlesData = metrics.map((metric) => ({
    date: metric.date,
    articles_published: metric.articles_published || 0,
  }))

  // Calcular estatísticas
  const totalArticles = metrics.reduce((sum, item) => sum + (item.articles_published || 0), 0)
  const totalAttendances = metrics.reduce((sum, item) => sum + (item.virtual_agent_attendances || 0), 0)
  const resolvedAttendances = metrics.reduce((sum, item) => sum + (item.virtual_agent_resolved || 0), 0)
  const unresolvedAttendances = metrics.reduce((sum, item) => sum + (item.virtual_agent_unresolved || 0), 0)

  // Calcular taxa de resolução
  const resolutionRate = totalAttendances > 0 ? ((resolvedAttendances / totalAttendances) * 100).toFixed(1) : "0.0"

  // Obter lista de materiais faltantes únicos com informações sobre sua origem
  const missingMaterialsMap = new Map()
  metrics.forEach((item) => {
    if (item.missing_materials && Array.isArray(item.missing_materials)) {
      item.missing_materials.forEach((material) => {
        if (!missingMaterialsMap.has(material)) {
          missingMaterialsMap.set(material, {
            material,
            metricIds: [item.id],
            dates: [item.date],
          })
        } else {
          const entry = missingMaterialsMap.get(material)
          if (!entry.metricIds.includes(item.id)) {
            entry.metricIds.push(item.id)
            entry.dates.push(item.date)
          }
        }
      })
    } else if (item.missing_materials && typeof item.missing_materials === "object") {
      Object.values(item.missing_materials).forEach((material) => {
        if (typeof material === "string") {
          if (!missingMaterialsMap.has(material)) {
            missingMaterialsMap.set(material, {
              material,
              metricIds: [item.id],
              dates: [item.date],
            })
          } else {
            const entry = missingMaterialsMap.get(material)
            if (!entry.metricIds.includes(item.id)) {
              entry.metricIds.push(item.id)
              entry.dates.push(item.date)
            }
          }
        }
      })
    }
  })

  // Filtrar materiais faltantes para remover os que já estão publicados
  const publishedNames = publishedMaterials.map((material) => material.material_name)
  const uniqueMissingMaterials = Array.from(missingMaterialsMap.values()).filter(
    (materialInfo) => !publishedNames.includes(materialInfo.material),
  )

  // Paginação
  const totalPages = Math.ceil(metrics.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageData = metrics.slice(startIndex, endIndex)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Função para marcar um material como publicado
  const markMaterialAsPublished = async (materialInfo) => {
    setProcessingMaterial(materialInfo.material)

    try {
      const supabase = getSupabase()

      // For each record containing this material
      for (const metricId of materialInfo.metricIds) {
        // Fetch the current record
        const { data: currentMetric, error: fetchError } = await supabase
          .from("metrics_genier")
          .select("missing_materials")
          .eq("id", metricId)
          .single()

        if (fetchError) {
          console.error("Error fetching metric:", fetchError)
          continue
        }

        // Remove the material from the list
        let updatedMissingMaterials = []

        if (Array.isArray(currentMetric.missing_materials)) {
          updatedMissingMaterials = currentMetric.missing_materials.filter((item) => item !== materialInfo.material)
        } else if (typeof currentMetric.missing_materials === "object") {
          updatedMissingMaterials = Object.values(currentMetric.missing_materials).filter(
            (item) => item !== materialInfo.material,
          )
        }

        // Update the record
        const { error: updateError } = await supabase
          .from("metrics_genier")
          .update({ missing_materials: updatedMissingMaterials })
          .eq("id", metricId)

        if (updateError) {
          console.error("Error updating metric:", updateError)
        }
      }

      // Increment the published articles counter for the most recent record
      if (materialInfo.dates && materialInfo.dates.length > 0) {
        // Find the most recent date
        const mostRecentDate = materialInfo.dates.sort().pop()

        // Find the record corresponding to this date
        const { data: recentMetric, error: recentError } = await supabase
          .from("metrics_genier")
          .select("*")
          .eq("date", mostRecentDate)
          .single()

        if (!recentError && recentMetric) {
          const newArticlesCount = (recentMetric.articles_published || 0) + 1

          await supabase
            .from("metrics_genier")
            .update({ articles_published: newArticlesCount })
            .eq("id", recentMetric.id)
        }
      }

      // Filter out non-UUID IDs
      const validUUIDs = materialInfo.metricIds.filter((id) => {
        const isValid = isValidUUID(id)
        if (!isValid) {
          console.warn(`Skipping invalid UUID: ${id}`)
        }
        return isValid
      })

      // Tente registrar o material publicado na API
      try {
        // Primeiro tente usar a API route
        const response = await fetch("/api/published-materials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "add",
            materialName: materialInfo.material,
            metricIds: validUUIDs.length > 0 ? validUUIDs : null,
          }),
        })

        const result = await response.json()

        if (result.success) {
          console.log("Material registered in database:", result.data)

          // Se tivermos sucesso, use o ID real do banco de dados
          const newPublishedMaterial = {
            id: result.data[0].id,
            material_name: materialInfo.material,
            published_at: new Date().toISOString(),
            original_metric_ids: validUUIDs.length > 0 ? validUUIDs : null,
            restored_at: null,
          }

          // Update the published materials list with the real database record
          setPublishedMaterials((prev) => [
            newPublishedMaterial,
            ...prev.filter((m) => m.material_name !== materialInfo.material),
          ])
        } else {
          throw new Error(result.error || "Failed to register material")
        }
      } catch (apiError) {
        console.warn("Error using API route, falling back to client-side state:", apiError)

        // Create a temporary published material entry for the UI
        const tempPublishedMaterial = {
          id: `temp-${Date.now()}`,
          material_name: materialInfo.material,
          published_at: new Date().toISOString(),
          original_metric_ids: validUUIDs.length > 0 ? validUUIDs : null,
          restored_at: null,
        }

        // Update the published materials list
        setPublishedMaterials((prev) => [
          tempPublishedMaterial,
          ...prev.filter((m) => m.material_name !== materialInfo.material),
        ])

        toast({
          title: "Material publicado localmente",
          description: `"${materialInfo.material}" foi marcado como publicado (modo local).`,
          duration: 3000,
        })
      }

      // Switch to the published materials tab
      setMaterialsView("published")

      // Refresh the data to update the missing materials list
      handleRefresh()
    } catch (error) {
      console.error("Error marking material as published:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar o material como publicado.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setProcessingMaterial(null)
    }
  }

  // Função para atualizar a lista de materiais faltantes com base nos materiais publicados
  const updateMissingMaterialsList = () => {
    // Esta função será chamada após carregar os dados do banco
    // para garantir que materiais já publicados não apareçam como faltantes

    // Obter todos os nomes de materiais publicados
    const publishedNames = publishedMaterials.map((material) => material.material_name)

    // Filtrar a lista de materiais faltantes para remover os que já estão publicados
    const filteredMissingMaterials = Array.from(missingMaterialsMap.values()).filter(
      (materialInfo) => !publishedNames.includes(materialInfo.material),
    )

    // Atualizar a lista de materiais faltantes
    return filteredMissingMaterials
  }

  // Função para restaurar um material publicado
  const restoreMaterial = async (publishedMaterial) => {
    setProcessingMaterial(publishedMaterial.material_name)

    try {
      const supabase = getSupabase()

      // Para cada registro original que continha este material
      if (
        publishedMaterial.original_metric_ids &&
        Array.isArray(publishedMaterial.original_metric_ids) &&
        publishedMaterial.original_metric_ids.length > 0
      ) {
        for (const metricId of publishedMaterial.original_metric_ids) {
          // Skip if not a valid UUID
          if (!isValidUUID(metricId)) {
            console.warn(`Skipping invalid UUID: ${metricId}`)
            continue
          }

          // Buscar o registro atual
          const { data: currentMetric, error: fetchError } = await supabase
            .from("metrics_genier")
            .select("missing_materials")
            .eq("id", metricId)
            .single()

          if (fetchError) {
            console.error("Error fetching metric:", fetchError)
            continue
          }

          // Adicionar o material de volta à lista
          let updatedMissingMaterials = []

          if (Array.isArray(currentMetric.missing_materials)) {
            updatedMissingMaterials = [...currentMetric.missing_materials, publishedMaterial.material_name]
          } else if (typeof currentMetric.missing_materials === "object") {
            updatedMissingMaterials = [
              ...Object.values(currentMetric.missing_materials),
              publishedMaterial.material_name,
            ]
          } else {
            updatedMissingMaterials = [publishedMaterial.material_name]
          }

          // Atualizar o registro
          const { error: updateError } = await supabase
            .from("metrics_genier")
            .update({ missing_materials: updatedMissingMaterials })
            .eq("id", metricId)

          if (updateError) {
            console.error("Error updating metric:", updateError)
          }
        }

        // Decrementar o contador de artigos publicados para o registro mais recente
        // Encontrar a data mais recente
        const validUUIDs = publishedMaterial.original_metric_ids.filter((id) => isValidUUID(id))

        if (validUUIDs.length > 0) {
          const { data: metrics, error: metricsError } = await supabase
            .from("metrics_genier")
            .select("*")
            .in("id", validUUIDs)
            .order("date", { ascending: false })
            .limit(1)

          if (!metricsError && metrics && metrics.length > 0) {
            const recentMetric = metrics[0]
            const newArticlesCount = Math.max((recentMetric.articles_published || 0) - 1, 0)

            await supabase
              .from("metrics_genier")
              .update({ articles_published: newArticlesCount })
              .eq("id", recentMetric.id)
          }
        }
      }

      // If it's a real database record (not a temp one), try to mark it as restored in the database
      if (!publishedMaterial.id.toString().startsWith("temp-")) {
        try {
          // Try using the API route first
          const response = await fetch("/api/published-materials", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "restore",
              materialId: publishedMaterial.id,
            }),
          })

          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error || "Failed to restore material")
          }
        } catch (apiError) {
          console.warn("Error using API route, falling back to client-side state:", apiError)

          // Try direct update with client - this might fail due to RLS but we'll handle it gracefully
          try {
            const { error: directUpdateError } = await supabase
              .from("published_materials")
              .update({ restored_at: new Date().toISOString() })
              .eq("id", publishedMaterial.id)

            if (directUpdateError) {
              console.warn("Could not update published_materials record:", directUpdateError)
            }
          } catch (updateError) {
            console.warn("Error updating published_materials:", updateError)
          }
        }
      }

      // Remove from the local published materials list
      setPublishedMaterials((prev) => prev.filter((item) => item.id !== publishedMaterial.id))

      toast({
        title: "Material restaurado",
        description: `"${publishedMaterial.material_name}" foi restaurado para a lista de materiais faltantes.`,
        duration: 3000,
      })

      // Atualizar os dados
      handleRefresh()
    } catch (error) {
      console.error("Error restoring material:", error)
      toast({
        title: "Erro",
        description: "Não foi possível restaurar o material.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setProcessingMaterial(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white text-gray-800">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gráficos - Genier</h1>
          <p className="text-sm text-gray-500">Visualização gráfica das métricas do Genier</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Sincronizando dados",
                description: "Sincronizando materiais com o banco de dados...",
                duration: 2000,
              })
              handleRefresh()
            }}
            className="gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
              <path d="M16 21h5v-5"></path>
            </svg>
            Sincronizar
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o período e a métrica para visualização</CardDescription>
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
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                      locale={ptBR}
                      initialFocus
                    />
                    <div className="flex justify-end p-2">
                      <Button onClick={handleFilter}>
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Estatísticas */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Total de Artigos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : totalArticles}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Total de Atendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totalAttendances}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Taxa de Resolução</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : `${resolutionRate}%`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-500 text-sm font-normal">Materiais Faltantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : uniqueMissingMaterials.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico - Sem abas, apenas o gráfico de pizza */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Métricas do Genier</CardTitle>
              <CardDescription>
                {selectedMetric === "articles" && "Artigos Publicados por período"}
                {selectedMetric === "attendances" && "Atendimentos por período"}
                {selectedMetric === "materials" && "Materiais por período"}
              </CardDescription>
            </div>
            <PieChart className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent className="h-[400px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="h-full">
                {selectedMetric === "articles" && <GenierArticlesChart data={articlesData} isLoading={isLoading} />}
                {selectedMetric === "attendances" && (
                  <GenierAttendanceChart data={attendanceData} isLoading={isLoading} />
                )}
                {selectedMetric === "materials" && (
                  <div className="flex flex-col h-full">
                    <Tabs value={materialsView} onValueChange={setMaterialsView} className="mb-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="missing">Materiais Faltantes ({uniqueMissingMaterials.length})</TabsTrigger>
                        <TabsTrigger value="published">Materiais Publicados ({publishedMaterials.length})</TabsTrigger>
                      </TabsList>

                      <TabsContent value="missing" className="mt-0 h-[320px] overflow-y-auto">
                        {uniqueMissingMaterials.length > 0 ? (
                          <ul className="space-y-2">
                            {uniqueMissingMaterials.map((materialInfo, index) => (
                              <li key={index} className="p-2 bg-gray-100 rounded flex items-center justify-between">
                                <span>{materialInfo.material}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full hover:bg-green-100"
                                  onClick={() => markMaterialAsPublished(materialInfo)}
                                  disabled={processingMaterial === materialInfo.material}
                                >
                                  {processingMaterial === materialInfo.material ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                                  ) : (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                  <span className="sr-only">Marcar como publicado</span>
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Nenhum material faltante registrado no período</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="published" className="mt-0 h-[320px] overflow-y-auto">
                        {publishedMaterials.length > 0 ? (
                          <ul className="space-y-2">
                            {publishedMaterials.map((material, index) => (
                              <li key={index} className="p-2 bg-green-50 rounded flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{material.material_name}</span>
                                  <p className="text-xs text-gray-500">
                                    Publicado em: {format(new Date(material.published_at), "dd/MM/yyyy HH:mm")}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full hover:bg-amber-100"
                                  onClick={() => restoreMaterial(material)}
                                  disabled={processingMaterial === material.material_name}
                                >
                                  {processingMaterial === material.material_name ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                                  ) : (
                                    <Undo2 className="h-4 w-4 text-amber-600" />
                                  )}
                                  <span className="sr-only">Restaurar material</span>
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">Nenhum material publicado recentemente</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados Detalhados com Paginação */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Detalhados</CardTitle>
            <CardDescription>Visualização detalhada dos dados do período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : metrics.length > 0 ? (
              <div className="space-y-3">
                {currentPageData.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{format(parseISO(item.date), "dd/MM/yyyy")}</h3>
                      <span className="text-sm text-gray-500">
                        Taxa de Resolução:{" "}
                        {item.virtual_agent_attendances
                          ? ((item.virtual_agent_resolved / item.virtual_agent_attendances) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Artigos</p>
                        <p className="font-semibold">{item.articles_published || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Atendimentos</p>
                        <p className="font-semibold">{item.virtual_agent_attendances || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Resolvidos</p>
                        <p className="font-semibold">{item.virtual_agent_resolved || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Não Resolvidos</p>
                        <p className="font-semibold">{item.virtual_agent_unresolved || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Nenhum dado encontrado para o período selecionado.</div>
            )}
          </CardContent>
          {metrics.length > 0 && (
            <CardFooter className="flex justify-between items-center pt-2">
              <div className="text-sm text-gray-500">
                Mostrando {startIndex + 1}-{Math.min(endIndex, metrics.length)} de {metrics.length} registros
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Página anterior</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Próxima página</span>
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
