import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Briefcase, DollarSign, Star } from "lucide-react"
import type { ConsultingStats } from "@/lib/types"

interface ConsultingStatsProps {
  stats: ConsultingStats
  isLoading: boolean
}

export function ConsultingStats({ stats, isLoading }: ConsultingStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="text-sm text-muted-foreground">
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-7 w-36" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Total de Projetos</div>
          <CardTitle className="text-2xl">{stats.totalProjects}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Briefcase className="mr-2 h-4 w-4" />
            <span className="text-sm">Todos os projetos</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Projetos Ativos</div>
          <CardTitle className="text-2xl">{stats.activeProjects}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Briefcase className="mr-2 h-4 w-4" />
            <span className="text-sm">Em andamento</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Projetos Concluídos</div>
          <CardTitle className="text-2xl">{stats.completedProjects}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Briefcase className="mr-2 h-4 w-4" />
            <span className="text-sm">Finalizados</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Receita Total</div>
          <CardTitle className="text-2xl">{formatCurrency(stats.totalRevenue)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4" />
            <span className="text-sm">Valor dos projetos</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm text-muted-foreground">Avaliação Média</div>
          <CardTitle className="text-2xl">{stats.averageRating.toFixed(1)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Star className="mr-2 h-4 w-4" />
            <span className="text-sm">Escala de 1 a 5</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
