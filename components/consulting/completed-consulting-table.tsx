"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Star, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { deleteConsultingProject } from "@/lib/consulting-service"
import type { ConsultingProject } from "@/lib/types"

interface CompletedConsultingTableProps {
  projects?: ConsultingProject[]
  consultores?: string[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function CompletedConsultingTable({
  projects = [],
  consultores = [],
  isLoading = false,
  onRefresh,
}: CompletedConsultingTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConsultor, setSelectedConsultor] = useState<string>("todos")
  const [selectedTipo, setSelectedTipo] = useState<string>("todos")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Garantir que projects é sempre um array válido
  const safeProjects = useMemo(() => {
    if (!Array.isArray(projects)) {
      console.warn("Projects não é um array válido:", projects)
      return []
    }
    return projects.filter(Boolean) // Remove elementos null/undefined
  }, [projects])

  // Garantir que consultores é sempre um array válido
  const safeConsultores = useMemo(() => {
    if (!Array.isArray(consultores)) {
      console.warn("Consultores não é um array válido:", consultores)
      return []
    }
    return consultores.filter(Boolean) // Remove elementos null/undefined
  }, [consultores])

  // Filtrar projetos concluídos
  const completedProjects = useMemo(() => {
    return safeProjects.filter((project) => project?.status === "concluido")
  }, [safeProjects])

  // Aplicar filtros
  const filteredProjects = useMemo(() => {
    let filtered = completedProjects

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project?.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project?.consultor?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por consultor
    if (selectedConsultor !== "todos") {
      filtered = filtered.filter((project) => project?.consultor === selectedConsultor)
    }

    // Filtro por tipo
    if (selectedTipo !== "todos") {
      filtered = filtered.filter((project) => project?.tipo === selectedTipo)
    }

    return filtered
  }, [completedProjects, searchTerm, selectedConsultor, selectedTipo])

  // Calcular total das comissões
  const totalComissoes = useMemo(() => {
    return filteredProjects.reduce((sum, project) => {
      return sum + (Number(project?.valor_comissao) || 0)
    }, 0)
  }, [filteredProjects])

  // Função para deletar projeto
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) {
      return
    }

    setDeletingId(id)
    try {
      const result = await deleteConsultingProject(id)
      if (result.success) {
        console.log("✅ Projeto deletado com sucesso")
        onRefresh?.() // Atualizar a lista
      } else {
        console.error("❌ Erro ao deletar projeto:", result.error)
        alert(`Erro ao deletar projeto: ${result.error}`)
      }
    } catch (error) {
      console.error("❌ Erro inesperado ao deletar projeto:", error)
      alert("Erro inesperado ao deletar projeto")
    } finally {
      setDeletingId(null)
    }
  }

  // Função para exportar dados
  const handleExport = () => {
    const csvContent = [
      // Cabeçalho
      [
        "Cliente",
        "Tipo",
        "Porte",
        "Consultor",
        "Data Início",
        "Data Término",
        "Data Finalização",
        "Duração (dias)",
        "Valor Consultoria",
        "Valor Comissão",
        "% Comissão",
        "Avaliação",
        "Prazo Atingido",
        "Observações",
      ].join(","),
      // Dados
      ...filteredProjects.map((project) =>
        [
          `"${project?.cliente || ""}"`,
          project?.tipo || "",
          project?.porte || "",
          `"${project?.consultor || ""}"`,
          project?.data_inicio || "",
          project?.data_termino || "",
          project?.data_finalizacao || "",
          project?.tempo_dias || 0,
          project?.valor_consultoria || 0,
          project?.valor_comissao || 0,
          project?.percentual_comissao || 0,
          project?.avaliacao_estrelas || "",
          project?.prazo_atingido ? "Sim" : "Não",
          `"${project?.nota_consultoria || ""}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `consultorias-concluidas-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Renderizar estrelas
  const renderStars = (rating: number | null | undefined) => {
    if (!rating) return <span className="text-gray-400">-</span>

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultorias Concluídas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Consultorias Concluídas</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Total Comissões: R$ {totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Badge>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cliente ou consultor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedConsultor} onValueChange={setSelectedConsultor}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Consultor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os consultores</SelectItem>
              {safeConsultores.map((consultor) => (
                <SelectItem key={consultor} value={consultor}>
                  {consultor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTipo} onValueChange={setSelectedTipo}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="consultoria">Consultoria</SelectItem>
              <SelectItem value="upsell">Upsell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Consultor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Porte</TableHead>
                <TableHead>Finalização</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="w-[50px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                    {completedProjects.length === 0
                      ? "Nenhuma consultoria concluída encontrada"
                      : "Nenhuma consultoria encontrada com os filtros aplicados"}
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredProjects.map((project) => (
                    <TableRow key={project?.id}>
                      <TableCell className="font-medium">{project?.cliente || "-"}</TableCell>
                      <TableCell>{project?.consultor || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={project?.tipo === "upsell" ? "secondary" : "default"}>
                          {project?.tipo || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{project?.porte || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        {project?.data_finalizacao
                          ? format(new Date(project.data_finalizacao), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>{project?.tempo_dias || 0} dias</TableCell>
                      <TableCell>
                        R$ {(project?.valor_consultoria || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        R$ {(project?.valor_comissao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        <div className="text-xs text-gray-500">{project?.percentual_comissao || 0}%</div>
                      </TableCell>
                      <TableCell>{renderStars(project?.avaliacao_estrelas)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={project?.prazo_atingido ? "default" : "destructive"}
                          className={
                            project?.prazo_atingido ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {project?.prazo_atingido ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(project?.id)}
                          disabled={deletingId === project?.id}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Linha de total */}
                  <TableRow className="bg-green-50 font-medium">
                    <TableCell colSpan={7} className="text-right">
                      <strong>Total das Comissões:</strong>
                    </TableCell>
                    <TableCell className="text-green-600 font-bold">
                      R$ {totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell colSpan={3}></TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Resumo */}
        {filteredProjects.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredProjects.length} de {completedProjects.length} consultorias concluídas
          </div>
        )}
      </CardContent>
    </Card>
  )
}
