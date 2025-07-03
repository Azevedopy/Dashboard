"use client"

import { useMemo } from "react"
import { TrendingUp, DollarSign, Star, Clock, Target, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { ConsultingProject } from "@/lib/types"

interface CompletedConsultingStatsProps {
  projects?: ConsultingProject[]
  isLoading?: boolean
}

export function CompletedConsultingStats({ projects = [], isLoading = false }: CompletedConsultingStatsProps) {
  // Garantir que projects é sempre um array válido
  const safeProjects = useMemo(() => {
    if (!Array.isArray(projects)) {
      console.warn("Projects não é um array válido:", projects)
      return []
    }
    return projects.filter(Boolean) // Remove elementos null/undefined
  }, [projects])

  // Filtrar apenas projetos concluídos
  const completedProjects = useMemo(() => {
    return safeProjects.filter((project) => project?.status === "concluido")
  }, [safeProjects])

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (completedProjects.length === 0) {
      return {
        totalProjects: 0,
        totalRevenue: 0,
        totalCommissions: 0,
        averageRating: 0,
        averageDuration: 0,
        onTimeRate: 0,
      }
    }

    const totalRevenue = completedProjects.reduce((sum, project) => {
      return sum + (Number(project?.valor_consultoria) || 0)
    }, 0)

    const totalCommissions = completedProjects.reduce((sum, project) => {
      return sum + (Number(project?.valor_comissao) || 0)
    }, 0)

    // Calcular média de avaliação
    const projectsWithRating = completedProjects.filter(
      (project) => project?.avaliacao_estrelas && project.avaliacao_estrelas > 0,
    )
    const averageRating =
      projectsWithRating.length > 0
        ? projectsWithRating.reduce((sum, project) => sum + (project?.avaliacao_estrelas || 0), 0) /
          projectsWithRating.length
        : 0

    // Calcular duração média
    const projectsWithDuration = completedProjects.filter((project) => project?.tempo_dias && project.tempo_dias > 0)
    const averageDuration =
      projectsWithDuration.length > 0
        ? projectsWithDuration.reduce((sum, project) => sum + (project?.tempo_dias || 0), 0) /
          projectsWithDuration.length
        : 0

    // Calcular taxa de cumprimento de prazo
    const projectsWithDeadlineInfo = completedProjects.filter(
      (project) => project?.prazo_atingido !== null && project?.prazo_atingido !== undefined,
    )
    const onTimeRate =
      projectsWithDeadlineInfo.length > 0
        ? (projectsWithDeadlineInfo.filter((project) => project?.prazo_atingido === true).length /
            projectsWithDeadlineInfo.length) *
          100
        : 0

    return {
      totalProjects: completedProjects.length,
      totalRevenue,
      totalCommissions,
      averageRating,
      averageDuration,
      onTimeRate,
    }
  }, [completedProjects])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: "Projetos Concluídos",
      value: stats.totalProjects.toString(),
      description: "Total de consultorias finalizadas",
      icon: Award,
      color: "text-blue-600",
    },
    {
      title: "Receita Total",
      value: `R$ ${stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      description: "Valor total das consultorias",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Total de Comissões",
      value: `R$ ${stats.totalCommissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      description: "Soma de todas as comissões",
      icon: DollarSign,
      color: "text-green-600",
      highlight: true, // Destacar este card
    },
    {
      title: "Avaliação Média",
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A",
      description: `${stats.averageRating > 0 ? "⭐".repeat(Math.round(stats.averageRating)) : "Sem avaliações"}`,
      icon: Star,
      color: "text-yellow-600",
    },
    {
      title: "Duração Média",
      value: stats.averageDuration > 0 ? `${Math.round(stats.averageDuration)} dias` : "N/A",
      description: "Tempo médio de projeto",
      icon: Clock,
      color: "text-purple-600",
    },
    {
      title: "Taxa de Prazo",
      value: stats.onTimeRate > 0 ? `${Math.round(stats.onTimeRate)}%` : "N/A",
      description: "Projetos entregues no prazo",
      icon: Target,
      color: "text-indigo-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className={card.highlight ? "border-green-200 bg-green-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.highlight ? "text-green-700" : ""}`}>{card.value}</div>
              <p className={`text-xs ${card.highlight ? "text-green-600" : "text-muted-foreground"}`}>
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
