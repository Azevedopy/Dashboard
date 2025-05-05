"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, Download, Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SupportStats } from "@/components/support/support-stats"
import { SupportTable } from "@/components/support/support-table"
import {
  getSupportProjects,
  getSupportStats,
  getSupportProjectTypes,
  getSupportConsultants,
  deleteSupportProject,
} from "@/lib/support-service"
import { exportToCSV } from "@/lib/export-utils"
import { useToast } from "@/components/ui/use-toast"

export default function SuporteProjetosPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState(null)
  const [projectTypes, setProjectTypes] = useState([])
  const [consultants, setConsultants] = useState([])
  const [filters, setFilters] = useState({
    status: "",
    consultor: "",
    cliente: "",
    tipo: "",
    dateRange: {
      from: undefined,
      to: undefined,
    },
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Buscar tipos de projetos, consultores e estatísticas
        const [projectsData, statsData, typesData, consultantsData] = await Promise.all([
          getSupportProjects(),
          getSupportStats(),
          getSupportProjectTypes(),
          getSupportConsultants(),
        ])

        setProjects(projectsData)
        setStats(statsData)
        setProjectTypes(typesData)
        setConsultants(consultantsData)
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados dos projetos.",
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
        status: filters.status,
        consultor: filters.consultor,
        cliente: filters.cliente,
        tipo: filters.tipo,
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

  const handleReset = async () => {
    setFilters({
      status: "",
      consultor: "",
      cliente: "",
      tipo: "",
      dateRange: {
        from: undefined,
        to: undefined,
      },
    })

    setIsLoading(true)
    try {
      const projectsData = await getSupportProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error("Erro ao resetar filtros:", error)
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

    const result = exportToCSV(projects, "projetos_suporte")
    toast({
      title: result.success ? "Sucesso" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    })
  }

  const handleDelete = async (id) => {
    if (confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
      try {
        const success = await deleteSupportProject(id)
        if (success) {
          toast({
            title: "Sucesso",
            description: "Projeto excluído com sucesso.",
          })
          // Atualizar a lista de projetos
          const updatedProjects = await getSupportProjects()
          setProjects(updatedProjects)
          // Atualizar estatísticas
          const updatedStats = await getSupportStats()
          setStats(updatedStats)
        } else {
          throw new Error("Não foi possível excluir o projeto.")
        }
      } catch (error) {
        console.error("Erro ao excluir projeto:", error)
        toast({
          title: "Erro",
          description: "Não foi possível excluir o projeto.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Projetos de Suporte</h1>
            <p className="text-sm text-muted-foreground">Gerencie e visualize todos os projetos de suporte</p>
          </div>
          <Button onClick={() => router.push("/suporte/projetos/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <SupportStats stats={stats} isLoading={isLoading} />

        <Tabs defaultValue="todos">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="em_andamento">Em Andamento</TabsTrigger>
              <TabsTrigger value="concluido">Concluídos</TabsTrigger>
              <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Refine sua busca por projetos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Cliente</label>
                  <Input
                    placeholder="Nome do cliente"
                    value={filters.cliente}
                    onChange={(e) => setFilters({ ...filters, cliente: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo</label>
                  <Select value={filters.tipo} onValueChange={(value) => setFilters({ ...filters, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {projectTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Consultor</label>
                  <Select
                    value={filters.consultor}
                    onValueChange={(value) => setFilters({ ...filters, consultor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um consultor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {consultants.map((consultant) => (
                        <SelectItem key={consultant} value={consultant}>
                          {consultant}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? (
                          filters.dateRange.to ? (
                            <>
                              {format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                              {format(filters.dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                            </>
                          ) : (
                            format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                          )
                        ) : (
                          "Selecione um período"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={filters.dateRange}
                        onSelect={(range) =>
                          setFilters({ ...filters, dateRange: range || { from: undefined, to: undefined } })
                        }
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={handleFilter}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrar
                </Button>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="todos" className="mt-6">
            <SupportTable projects={projects} isLoading={isLoading} onDelete={handleDelete} />
          </TabsContent>

          <TabsContent value="em_andamento" className="mt-6">
            <SupportTable
              projects={projects.filter((p) => p.status === "em_andamento")}
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="concluido" className="mt-6">
            <SupportTable
              projects={projects.filter((p) => p.status === "concluido")}
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="atrasado" className="mt-6">
            <SupportTable
              projects={projects.filter((p) => p.status === "atrasado")}
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
