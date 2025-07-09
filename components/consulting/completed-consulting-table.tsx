"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye, Edit, Star, CheckCircle, XCircle, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { getCompletedConsultingProjects } from "@/lib/completed-consulting-service"
import type { ConsultingProject } from "@/lib/types"

interface CompletedConsultingTableProps {
  projects?: ConsultingProject[]
  isLoading?: boolean
}

export function CompletedConsultingTable({
  projects: externalProjects,
  isLoading: externalLoading,
}: CompletedConsultingTableProps) {
  const [projects, setProjects] = useState<ConsultingProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (externalProjects) {
      console.log("📊 Usando projetos externos:", externalProjects)
      setProjects(externalProjects)
      setIsLoading(externalLoading || false)
    } else {
      loadProjects()
    }
  }, [externalProjects, externalLoading])

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      console.log("🔄 Carregando projetos concluídos...")
      const data = await getCompletedConsultingProjects()
      console.log("✅ Projetos carregados:", data)
      setProjects(data)
    } catch (error) {
      console.error("❌ Erro ao carregar projetos concluídos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos concluídos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "concluido":
      case "finalizado":
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
      case "em_andamento":
        return <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status || "N/A"}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    console.log("🏷️ Renderizando tipo:", tipo)

    // Normalizar o tipo para comparação
    const tipoNormalizado = tipo?.toLowerCase().trim()

    switch (tipoNormalizado) {
      case "consultoria":
        return <Badge className="bg-blue-100 text-blue-800">Consultoria</Badge>
      case "upsell":
        return <Badge className="bg-purple-100 text-purple-800">Upsell</Badge>
      default:
        // Mostrar o valor original se não reconhecer
        return <Badge variant="outline">{tipo || "N/A"}</Badge>
    }
  }

  const getPorteBadge = (porte: string) => {
    const porteColors = {
      basic: "bg-gray-100 text-gray-800",
      starter: "bg-blue-100 text-blue-800",
      pro: "bg-purple-100 text-purple-800",
      enterprise: "bg-orange-100 text-orange-800",
    }

    const porteNormalizado = porte?.toLowerCase()
    const colorClass = porteColors[porteNormalizado as keyof typeof porteColors] || "bg-gray-100 text-gray-800"

    return <Badge className={colorClass}>{porte?.charAt(0).toUpperCase() + porte?.slice(1) || "N/A"}</Badge>
  }

  const renderStars = (rating: number) => {
    if (!rating || rating === 0) {
      return <span className="text-muted-foreground text-sm">Não avaliado</span>
    }

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
    if (prazoAtingido === null || prazoAtingido === undefined) {
      return <Clock className="h-4 w-4 text-gray-400" />
    }
    return prazoAtingido ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      console.error("Erro ao formatar data:", dateString, error)
      return dateString
    }
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
                {projects.map((project) => {
                  console.log("🔍 Renderizando projeto:", {
                    id: project.id,
                    cliente: project.cliente,
                    tipo: project.tipo,
                    consultor: project.consultor,
                  })

                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.cliente || "N/A"}</TableCell>
                      <TableCell>{project.consultor || "Não atribuído"}</TableCell>
                      <TableCell>{getTipoBadge(project.tipo)}</TableCell>
                      <TableCell>{getPorteBadge(project.porte)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(project.data_inicio)}</div>
                          <div className="text-muted-foreground">até {formatDate(project.data_termino)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{project.tempo_dias || 0} dias</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(project.valor_consultoria || 0)}</div>
                          {project.bonificada && <div className="text-xs text-blue-600">Bonificada</div>}
                        </div>
                      </TableCell>
                      <TableCell>{renderStars(project.avaliacao_estrelas || 0)}</TableCell>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
