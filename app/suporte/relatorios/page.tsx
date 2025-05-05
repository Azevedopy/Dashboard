"use client"

import { useState, useEffect } from "react"
import { format, subMonths } from "date-fns"
import {
  getSupportProjects,
  getSupportProjectTypes,
  getSupportConsultants,
  getSupportProjectSizes,
} from "@/lib/support-service"
import { exportToCSV } from "@/lib/export-utils"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2, Download, Filter } from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts"

export default function SuporteRelatoriosPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [projectTypes, setProjectTypes] = useState([])
  const [consultants, setConsultants] = useState([])
  const [projectSizes, setProjectSizes] = useState([])
  const [filters, setFilters] = useState({
    tipo: "",
    consultor: "",
    porte: "",
    dateRange: {
      from: subMonths(new Date(), 6),
      to: new Date(),
    },
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Buscar tipos de projetos, consultores e portes
        const [projectsData, typesData, consultantsData, sizesData] = await Promise.all([
          getSupportProjects({
            startDate: format(filters.dateRange.from, "yyyy-MM-dd"),
            endDate: format(filters.dateRange.to, "yyyy-MM-dd"),
          }),
          getSupportProjectTypes(),
          getSupportConsultants(),
          getSupportProjectSizes(),
        ])

        setProjects(projectsData)
        setProjectTypes(typesData)
        setConsultants(consultantsData)
        setProjectSizes(sizesData)
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados dos relatórios.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleFilter = async () => {
    setIsLoading(true)
    try {
      const filteredProjects = await getSupportProjects({
        tipo: filters.tipo,
        consultor: filters.consultor,
        porte: filters.porte,
        startDate: filters.dateRange.from ? format(filters.dateRange.from, "yyyy-MM-dd") : undefined,
        endDate: filters.dateRange.to ? format(filters.dateRange.to, "yyyy-MM-dd") : undefined,
      })
      setProjects(filteredProjects)
      setIsCalendarOpen(false)
    } catch (error) {
      console.error("Erro ao filtrar projetos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível filtrar os projetos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (!projects.length) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar.",
        variant: "warning",
      })
      return
    }

    const result = exportToCSV(projects, "relatorio_suporte")
    toast({
      title: result.success ? "Sucesso" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
  }

  // Calcular estatísticas para os relatórios
  const calculateStats = () => {
    if (!projects.length) return null

    // Projetos por tipo
    const byType = projectTypes.map((type) => ({
      name: type,
      value: projects.filter((p) => p.tipo === type).length,
    }))

    // Projetos por consultor
    const byConsultant = consultants.map((consultant) => ({
      name: consultant,
      value: projects.filter((p) => p.consultor === consultant).length,
    }))

    // Projetos por porte
    const bySize = projectSizes.map((size) => ({
      name: size,
      value: projects.filter((p) => p.porte === size).length,
    }))

    // Projetos por status
    const byStatus = [
      { name: "Em Andamento", value: projects.filter((p) => p.status === "em_andamento").length },
      { name: "Concluído", value: projects.filter((p) => p.status === "concluido").length },
      { name: "Cancelado", value: projects.filter((p) => p.status === "cancelado").length },
    ]

    return { byType, byConsultant, bySize, byStatus }
  }

  const stats = calculateStats()
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Relatórios de Suporte</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Select value={filters.tipo} onValueChange={(value) => setFilters({ ...filters, tipo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {projectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.consultor} onValueChange={(value) => setFilters({ ...filters, consultor: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Consultor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os consultores</SelectItem>
              {consultants.map((consultant) => (
                <SelectItem key={consultant} value={consultant}>
                  {consultant}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={filters.porte} onValueChange={(value) => setFilters({ ...filters, porte: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Porte do Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os portes</SelectItem>
              {projectSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {filters.dateRange.from && filters.dateRange.to
                ? `${format(filters.dateRange.from, "dd/MM/yyyy")} - ${format(filters.dateRange.to, "dd/MM/yyyy")}`
                : "Selecione o período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: filters.dateRange.from,
                to: filters.dateRange.to,
              }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setFilters({
                    ...filters,
                    dateRange: { from: range.from, to: range.to },
                  })
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button onClick={handleFilter} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando
            </>
          ) : (
            <>
              <Filter className="mr-2 h-4 w-4" /> Filtrar
            </>
          )}
        </Button>

        <Button variant="outline" onClick={handleExport} disabled={!projects.length}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : !projects.length ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Nenhum projeto encontrado com os filtros selecionados.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Projetos por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.byType.filter((item) => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {stats.byType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Projetos por Consultor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.byConsultant.filter((item) => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {stats.byConsultant.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Projetos por Porte</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.bySize.filter((item) => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {stats.bySize.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Projetos por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.byStatus.filter((item) => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {stats.byStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">Nome</th>
                      <th className="py-2 px-4 text-left">Tipo</th>
                      <th className="py-2 px-4 text-left">Consultor</th>
                      <th className="py-2 px-4 text-left">Porte</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Data de Início</th>
                      <th className="py-2 px-4 text-left">Data de Conclusão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{project.nome}</td>
                        <td className="py-2 px-4">{project.tipo}</td>
                        <td className="py-2 px-4">{project.consultor}</td>
                        <td className="py-2 px-4">{project.porte}</td>
                        <td className="py-2 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              project.status === "em_andamento"
                                ? "bg-blue-100 text-blue-800"
                                : project.status === "concluido"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {project.status === "em_andamento"
                              ? "Em Andamento"
                              : project.status === "concluido"
                                ? "Concluído"
                                : "Cancelado"}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {project.data_inicio ? format(new Date(project.data_inicio), "dd/MM/yyyy") : "-"}
                        </td>
                        <td className="py-2 px-4">
                          {project.data_conclusao ? format(new Date(project.data_conclusao), "dd/MM/yyyy") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
