"use client"

import { useMemo } from "react"
import { TrendingUp, DollarSign, Star, Clock, CheckCircle, Target } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import type { ConsultingProject } from "@/lib/consulting-service"

interface CompletedConsultingStatsProps {
  projects?: ConsultingProject[]
  isLoading?: boolean
}

export function CompletedConsultingStats({ projects = [], isLoading = false }: CompletedConsultingStatsProps) {
  // Garantir que projects é sempre um array válido
  const validProjects = useMemo(() => {
    if (!Array.isArray(projects)) return []
    return projects.filter((project) => project != null)
  }, [projects])

  const stats = useMemo(() => {
    if (validProjects.length === 0) {
      return {
        totalProjetos: 0,
        receitaTotal: 0,
        totalComissoes: 0,
        avaliacaoMedia: 0,
        duracaoMedia: 0,
        taxaCumprimentoPrazo: 0,
      }
    }

    const totalProjetos = validProjects.length
    const receitaTotal = validProjects.reduce((sum, p) => sum + (p.valor_consultoria || 0), 0)
    const totalComissoes = validProjects.reduce((sum, p) => sum + (p.valor_comissao || 0), 0)

    // Calcular avaliação média
    const projetosComAvaliacao = validProjects.filter((p) => p.avaliacao_estrelas)
    const avaliacaoMedia =
      projetosComAvaliacao.length > 0
        ? projetosComAvaliacao.reduce((sum, p) => sum + (p.avaliacao_estrelas || 0), 0) / projetosComAvaliacao.length
        : 0

    // Calcular duração média
    const projetosComDuracao = validProjects.filter((p) => p.tempo_dias)
    const duracaoMedia =
      projetosComDuracao.length > 0
        ? projetosComDuracao.reduce((sum, p) => sum + (p.tempo_dias || 0), 0) / projetosComDuracao.length
        : 0

    // Calcular taxa de cumprimento de prazo
    const projetosComPrazo = validProjects.filter((p) => p.prazo_atingido !== null)
    const projetosNoPrazo = validProjects.filter((p) => p.prazo_atingido === true)
    const taxaCumprimentoPrazo =
      projetosComPrazo.length > 0 ? (projetosNoPrazo.length / projetosComPrazo.length) * 100 : 0

    return {
      totalProjetos,
      receitaTotal,
      totalComissoes,
      avaliacaoMedia,
      duracaoMedia,
      taxaCumprimentoPrazo,
    }
  }, [validProjects])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total de Projetos Concluídos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProjetos}</div>
          <p className="text-xs text-muted-foreground">Total de consultorias finalizadas</p>
        </CardContent>
      </Card>

      {/* Receita Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.receitaTotal)}</div>
          <p className="text-xs text-muted-foreground">Valor total das consultorias</p>
        </CardContent>
      </Card>

      {/* Total de Comissões - Destacado em verde */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">Total de Comissões</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalComissoes)}</div>
          <p className="text-xs text-green-600">Comissões pagas aos consultores</p>
        </CardContent>
      </Card>

      {/* Avaliação Média */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-1">
            {stats.avaliacaoMedia.toFixed(1)}
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          </div>
          <p className="text-xs text-muted-foreground">Média das avaliações recebidas</p>
        </CardContent>
      </Card>

      {/* Duração Média */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(stats.duracaoMedia)} dias</div>
          <p className="text-xs text-muted-foreground">Tempo médio de execução</p>
        </CardContent>
      </Card>

      {/* Taxa de Cumprimento de Prazo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Cumprimento</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.taxaCumprimentoPrazo.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Projetos entregues no prazo</p>
        </CardContent>
      </Card>
    </div>
  )
}
