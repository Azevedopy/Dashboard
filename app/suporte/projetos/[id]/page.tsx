"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, User, Tag, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getSupportProjectById, deleteSupportProject } from "@/lib/support-service"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"

export default function DetalhesProjetoSuportePage({ params }) {
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProject() {
      try {
        const projectData = await getSupportProjectById(params.id)
        if (projectData) {
          setProject(projectData)
        } else {
          toast({
            title: "Erro",
            description: "Projeto não encontrado.",
            variant: "destructive",
          })
          router.push("/suporte/projetos")
        }
      } catch (error) {
        console.error("Erro ao buscar projeto:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do projeto.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [params.id, router, toast])

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
      try {
        const success = await deleteSupportProject(params.id)
        if (success) {
          toast({
            title: "Sucesso",
            description: "Projeto excluído com sucesso.",
          })
          router.push("/suporte/projetos")
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

  const getStatusBadge = (status) => {
    if (!status) return <Badge variant="outline">Não definido</Badge>

    switch (status) {
      case "em_andamento":
        return <Badge>Em Andamento</Badge>
      case "concluido":
        return <Badge variant="success">Concluído</Badge>
      case "atrasado":
        return <Badge variant="warning">Atrasado</Badge>
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Não definido"

    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Carregando...</h1>
              <p className="text-sm text-muted-foreground">Aguarde enquanto carregamos os dados do projeto</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="h-96 flex items-center justify-center">
            <div className="animate-pulse">Carregando detalhes do projeto...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Projeto não encontrado</h1>
              <p className="text-sm text-muted-foreground">O projeto solicitado não existe ou foi removido</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.cliente || "Sem cliente"}</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{project.tipo || "Sem tipo"}</p>
                {project.status && getStatusBadge(project.status)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/suporte/projetos/${params.id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>Detalhes básicos do projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium mr-2">Tipo:</span>
                <span>{project.tipo || "Não definido"}</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium mr-2">Consultor:</span>
                <span>{project.consultor || "Não atribuído"}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium mr-2">Período:</span>
                <span>
                  {project.data_inicio ? formatDate(project.data_inicio) : "Não definido"} a{" "}
                  {project.data_termino ? formatDate(project.data_termino) : "Não definido"}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium mr-2">Duração:</span>
                <span>{project.tempo_dias ? `${project.tempo_dias} dias` : "Não definido"}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium mr-2">Valor:</span>
                <span>{project.valor_consultoria ? formatCurrency(project.valor_consultoria) : "R$ 0,00"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes Financeiros</CardTitle>
              <CardDescription>Informações financeiras do projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor da Consultoria</p>
                  <p className="text-lg font-semibold">
                    {project.valor_consultoria ? formatCurrency(project.valor_consultoria) : "R$ 0,00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor do Bônus</p>
                  <p className="text-lg font-semibold">
                    {project.valor_bonus ? formatCurrency(project.valor_bonus) : "R$ 0,00"}
                  </p>
                </div>
                {project.valor_bonus_12 !== null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor do Bônus 12</p>
                    <p className="text-lg font-semibold">{formatCurrency(project.valor_bonus_12)}</p>
                  </div>
                )}
                {project.valor_liquido_projeto !== null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Líquido</p>
                    <p className="text-lg font-semibold">{formatCurrency(project.valor_liquido_projeto)}</p>
                  </div>
                )}
                {project.valor_comissao !== null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor da Comissão</p>
                    <p className="text-lg font-semibold">{formatCurrency(project.valor_comissao)}</p>
                  </div>
                )}
                {project.percentual_comissao !== null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Percentual de Comissão</p>
                    <p className="text-lg font-semibold">{project.percentual_comissao}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
            <CardDescription>Detalhes complementares do projeto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Porte</p>
                <p>{project.porte || "Não definido"}</p>
              </div>
              {project.porte_detalhado && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Detalhes do Porte</p>
                  <p>{project.porte_detalhado}</p>
                </div>
              )}
              {project.avaliacao && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avaliação</p>
                  <p>{project.avaliacao}</p>
                </div>
              )}
              {project.avaliacao_estrelas !== null && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avaliação (Estrelas)</p>
                  <p>{project.avaliacao_estrelas} / 5</p>
                </div>
              )}
              {project.nota_consultoria !== null && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nota da Consultoria</p>
                  <p>{project.nota_consultoria}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prazo Atingido</p>
                <p>
                  {project.prazo_atingido === true ? "Sim" : project.prazo_atingido === false ? "Não" : "Não definido"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {project.data_virada && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Virada</p>
                  <p>{formatDate(project.data_virada)}</p>
                </div>
              )}
              {project.data_fechamento && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Fechamento</p>
                  <p>{formatDate(project.data_fechamento)}</p>
                </div>
              )}
              {project.data_finalizacao && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Finalização</p>
                  <p>{formatDate(project.data_finalizacao)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
