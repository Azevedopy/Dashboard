"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye, Edit, Trash2, Star, CheckCircle, XCircle, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { getCompletedConsultingProjects, deleteConsultingProject } from "@/lib/consulting-service"
import type { ConsultingProject } from "@/lib/consulting-service"

export function CompletedConsultingTable() {
  const [projects, setProjects] = useState<ConsultingProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const data = await getCompletedConsultingProjects()
      setProjects(data)
    } catch (error) {
      console.error("Erro ao carregar projetos concluídos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos concluídos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) {
      return
    }

    try {
      const result = await deleteConsultingProject(id)
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Projeto excluído com sucesso.",
        })
        loadProjects() // Recarregar a lista
      } else {
        throw new Error(result.error || "Erro ao excluir projeto")
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluido":
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
      case "em_andamento":
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPorteBadge = (porte: string) => {
    const porteColors = {
      basic: "bg-gray-100 text-gray-800",
      starter: "bg-blue-100 text-blue-800",
      pro: "bg-purple-100 text-purple-800",
      enterprise: "bg-orange-100 text-orange-800",
    }

    return (
      <Badge className={porteColors[porte as keyof typeof porteColors] || "bg-gray-100 text-gray-800"}>
        {porte.charAt(0).toUpperCase() + porte.slice(1)}
      </Badge>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-4 w-4 ${star <= rating ? "text-yellow-500 fill-current" : "text-gray-300"}`} />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    )
  }

  const getPrazoIcon = (prazoAtingido: boolean | null) => {
    if (prazoAtingido === null) return <Clock className="h-4 w-4 text-gray-400" />
    return prazoAtingido ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultorias Concluídas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando projetos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Consultorias Concluídas
          <Badge variant="secondary">{projects.length} projetos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma consultoria concluída encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Consultor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Porte</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Bonificada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.cliente}</TableCell>
                    <TableCell>{project.consultor}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.tipo === "consultoria" ? "Consultoria" : "Upsell"}</Badge>
                    </TableCell>
                    <TableCell>{getPorteBadge(project.porte)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(project.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</div>
                        <div className="text-muted-foreground">
                          até {format(new Date(project.data_termino), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{project.tempo_dias || 0} dias</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(project.valor_consultoria)}</div>
                        {project.bonificada && <div className="text-xs text-blue-600">Bonificada</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.avaliacao_estrelas ? (
                        renderStars(project.avaliacao_estrelas)
                      ) : (
                        <span className="text-muted-foreground text-sm">Não avaliado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPrazoIcon(project.prazo_atingido)}
                        <span className="text-sm">
                          {project.prazo_atingido === null ? "N/A" : project.prazo_atingido ? "Atingido" : "Excedido"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(project.valor_comissao || 0)}</div>
                        <div className="text-muted-foreground">{project.percentual_comissao || 0}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.bonificada ? (
                        <Badge className="bg-blue-100 text-blue-800">Sim</Badge>
                      ) : (
                        <Badge variant="outline">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status || "concluido")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/consultoria/projetos/${project.id}`, "_blank")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/consultoria/projetos/editar/${project.id}`, "_blank")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
