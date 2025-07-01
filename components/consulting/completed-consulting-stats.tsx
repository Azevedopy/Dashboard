"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import type { ConsultingProject } from "@/lib/types"
import { TrendingUp, Star, DollarSign } from "lucide-react"

interface CompletedConsultingStatsProps {
  projects: ConsultingProject[]
  isLoading: boolean
}

export function CompletedConsultingStats({ projects, isLoading }: CompletedConsultingStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4)
          .fill(0)
          .map((_, index) => (
            <Card key={index}>
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

  // Calcular estatísticas
  const totalProjects = projects.length

  const totalRevenue = projects.reduce((sum, project) => {
    return sum + (Number(project.valor_consultoria) || 0)
  }, 0)

  const totalCommission = projects.reduce((sum, project) => {
    return sum + (Number(project.valor_comissao) || 0)
  }, 0)

  const averageRating =
    projects.length > 0
      ? projects.reduce((sum, project) => {
          return sum + (Number(project.avaliacao_estrelas) || 0)
        }, 0) / projects.length
      : 0

  const deadlineCompliance =
    projects.length > 0 ? (projects.filter((project) => project.prazo_atingido).length / projects.length) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProjects}</div>
          <p className="text-xs text-muted-foreground">Consultorias concluídas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Valor total das consultorias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCommission)}</div>
          <p className="text-xs text-muted-foreground">Total em comissões</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5</div>
          <p className="text-xs text-muted-foreground">{deadlineCompliance.toFixed(0)}% prazo atingido</p>
        </CardContent>
      </Card>
    </div>
  )
}
