"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Edit, Briefcase, Calendar, DollarSign, User, Star, Clock, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getConsultingProject } from "@/lib/consulting-service"
import type { ConsultingProject } from "@/lib/types"

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<ConsultingProject | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string)
    }
  }, [params.id])

  const fetchProject = async (id: string) => {
    setIsLoading(true)
    try {
      console.log(`Buscando projeto com ID: ${id}`) // Log para debug
      const data = await getConsultingProject(id)
      if (data) {
        console.log("Projeto encontrado:", data) // Log para debug
        setProject(data)
      } else {
        console.log("Projeto não encontrado") // Log para debug
        toast({
          title: "Projeto não encontrado",
          description: "O projeto solicitado não foi encontrado.",
          variant: "destructive",
        })
        router.push("/consultoria/projetos")
      }
    } catch (error) {
      console.error("Error fetching project:", error)
      toast({
        title: "Erro ao carregar projeto",
        description: "Não foi possível carregar os dados do projeto. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  // Formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não definido"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }

  // Obter badge de status
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "em_andamento":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
            Em Andamento
          </Badge>
        )
      case "concluido":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
            Concluído
          </Badge>
        )
      case "cancelado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Detalhes do Projeto</h1>
          <p className="text-sm text-muted-foreground">Visualize informações detalhadas do projeto</p>
        </div>
        {project && (
          <Button
            onClick={() => router.push(`/consultoria/projetos/editar/${project.id}`)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="h-4 w-4" />
            Editar Projeto
          </Button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
          </div>
        ) : project ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <h2 className="text-3xl font-bold">{project.cliente}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{project.tipo}</Badge>
                  {getStatusBadge(project.status)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(Number(project.valor_consultoria) || 0)}</div>
                <p className="text-sm text-muted-foreground">Valor do Projeto</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Projeto</CardTitle>
                  <CardDescription>Dados básicos do projeto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Consultoria</p>
                      <p className="font-medium">{project.tipo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Consultor</p>
                      <p className="font-medium">{project.consultor || "Não atribuído"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Período</p>
                      <p className="font-medium">
                        {formatDate(project.data_inicio)} a {formatDate(project.data_termino)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duração</p>
                      <p className="font-medium">{project.tempo_dias} dias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações Financeiras</CardTitle>
                  <CardDescription>Dados financeiros do projeto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor da Consultoria</p>
                      <p className="font-medium">{formatCurrency(Number(project.valor_consultoria) || 0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor de Bônus</p>
                      <p className="font-medium">{formatCurrency(Number(project.valor_bonus) || 0)}</p>
                    </div>
                  </div>
                  {project.valor_liquido_projeto !== undefined && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Líquido</p>
                        <p className="font-medium">{formatCurrency(Number(project.valor_liquido_projeto) || 0)}</p>
                      </div>
                    </div>
                  )}
                  {project.valor_comissao !== undefined && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Comissão</p>
                        <p className="font-medium">
                          {formatCurrency(Number(project.valor_comissao) || 0)}
                          {project.percentual_comissao && ` (${project.percentual_comissao}%)`}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes Adicionais</CardTitle>
                  <CardDescription>Informações complementares</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Porte</p>
                      <p className="font-medium">{project.porte}</p>
                    </div>
                  </div>
                  {project.porte_detalhado && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Porte Detalhado</p>
                        <p className="font-medium">{project.porte_detalhado}</p>
                      </div>
                    </div>
                  )}
                  {project.data_fechamento && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Fechamento</p>
                        <p className="font-medium">{formatDate(project.data_fechamento)}</p>
                      </div>
                    </div>
                  )}
                  {project.data_virada && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Virada</p>
                        <p className="font-medium">{formatDate(project.data_virada)}</p>
                      </div>
                    </div>
                  )}
                  {project.prazo_atingido !== undefined && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Prazo Atingido</p>
                        <p className="font-medium">{project.prazo_atingido ? "Sim" : "Não"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avaliação</CardTitle>
                  <CardDescription>Feedback e avaliação do projeto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.avaliacao_estrelas !== undefined && (
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Avaliação em Estrelas</p>
                        <p className="font-medium">{project.avaliacao_estrelas} / 5</p>
                      </div>
                    </div>
                  )}
                  {project.nota_consultoria !== undefined && (
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Nota da Consultoria</p>
                        <p className="font-medium">{project.nota_consultoria} / 10</p>
                      </div>
                    </div>
                  )}
                  {project.avaliacao && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Comentários</p>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">{project.avaliacao}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Projeto não encontrado</p>
            <Button
              variant="outline"
              className="mt-4 bg-transparent"
              onClick={() => router.push("/consultoria/projetos")}
            >
              Voltar para Lista de Projetos
            </Button>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  )
}
