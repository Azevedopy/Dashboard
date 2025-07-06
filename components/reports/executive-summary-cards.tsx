"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Award, Clock, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { ConsultingProject } from "@/lib/types"

interface ExecutiveSummaryCardsProps {
  projects: ConsultingProject[]
  isLoading: boolean
}

export function ExecutiveSummaryCards({ projects, isLoading }: ExecutiveSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Cálculos das métricas
  const totalProjects = projects.length
  const totalRevenue = projects.reduce((sum, p) => sum + (p.valor_consultoria || 0), 0)
  const totalCommissions = projects.reduce((sum, p) => sum + (p.valor_comissao || 0), 0)
  const netRevenue = totalRevenue - totalCommissions

  const projectsWithRating = projects.filter((p) => p.avaliacao_estrelas && p.avaliacao_estrelas > 0)
  const averageRating =
    projectsWithRating.length > 0
      ? projectsWithRating.reduce((sum, p) => sum + (p.avaliacao_estrelas || 0), 0) / projectsWithRating.length
      : 0

  const onTimeProjects = projects.filter((p) => p.prazo_atingido === true)
  const onTimeRate = totalProjects > 0 ? (onTimeProjects.length / totalProjects) * 100 : 0

  const bonifiedProjects = projects.filter((p) => p.bonificada === true)
  const bonificationRate = totalProjects > 0 ? (bonifiedProjects.length / totalProjects) * 100 : 0

  const averageProjectDuration =
    totalProjects > 0 ? projects.reduce((sum, p) => sum + (p.tempo_dias || 0), 0) / totalProjects : 0

  const averageTicket = totalProjects > 0 ? totalRevenue / totalProjects : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getPerformanceBadge = (value: number, thresholds: { excellent: number; good: number }) => {
    if (value >= thresholds.excellent) {
      return <Badge className="bg-green-100 text-green-800">Excelente</Badge>
    } else if (value >= thresholds.good) {
      return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Atenção</Badge>
    }
  }

  const cards = [
    {
      title: "Total de Projetos",
      value: totalProjects.toString(),
      description: "Consultorias e upsells concluídos",
      icon: Users,
      badge: totalProjects > 50 ? "Excelente" : totalProjects > 20 ? "Bom" : "Atenção",
      trend: null,
    },
    {
      title: "Receita Total",
      value: formatCurrency(totalRevenue),
      description: "Valor bruto das consultorias",
      icon: DollarSign,
      badge: null,
      trend: totalRevenue > 500000 ? "up" : totalRevenue > 200000 ? "stable" : "down",
    },
    {
      title: "Receita Líquida",
      value: formatCurrency(netRevenue),
      description: "Após dedução de comissões",
      icon: TrendingUp,
      badge: null,
      trend: netRevenue > 400000 ? "up" : netRevenue > 150000 ? "stable" : "down",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(averageTicket),
      description: "Valor médio por projeto",
      icon: Target,
      badge: null,
      trend: averageTicket > 15000 ? "up" : averageTicket > 8000 ? "stable" : "down",
    },
    {
      title: "Avaliação Média",
      value: averageRating > 0 ? `${averageRating.toFixed(1)} ⭐` : "N/A",
      description: "Satisfação dos clientes",
      icon: Star,
      badge: getPerformanceBadge(averageRating, { excellent: 4.5, good: 4.0 }),
      trend: null,
    },
    {
      title: "Taxa de Prazo",
      value: `${onTimeRate.toFixed(1)}%`,
      description: "Projetos entregues no prazo",
      icon: Clock,
      badge: getPerformanceBadge(onTimeRate, { excellent: 85, good: 70 }),
      trend: null,
    },
    {
      title: "Taxa de Bonificação",
      value: `${bonificationRate.toFixed(1)}%`,
      description: "Projetos bonificados",
      icon: Award,
      badge: getPerformanceBadge(bonificationRate, { excellent: 60, good: 40 }),
      trend: null,
    },
    {
      title: "Duração Média",
      value: `${averageProjectDuration.toFixed(0)} dias`,
      description: "Tempo médio de execução",
      icon: Clock,
      badge: getPerformanceBadge(100 - (averageProjectDuration / 30) * 100, { excellent: 70, good: 50 }),
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {card.badge &&
                  (typeof card.badge === "string" ? (
                    <Badge
                      variant={
                        card.badge === "Excelente" ? "default" : card.badge === "Bom" ? "secondary" : "destructive"
                      }
                    >
                      {card.badge}
                    </Badge>
                  ) : (
                    card.badge
                  ))}
                {card.trend && (
                  <div className="flex items-center">
                    {card.trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                    {card.trend === "down" && <TrendingDown className="h-3 w-3 text-red-600" />}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
