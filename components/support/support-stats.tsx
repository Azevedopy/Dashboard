"use client"

import { CheckCircle, Users, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SupportStats({ stats, isLoading }) {
  // Verificação para ambiente de preview - sempre mostra dados de exemplo
  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.dev")

  // Dados de exemplo para preview
  const mockStats = {
    totalTickets: 235,
    resolvedFirstContact: 175,
    notResolvedFirstContact: 60,
    resolvedTickets: 230,
    openTickets: 5,
    evaluatedTickets: 200,
    resolutionRate: 97.8,
    csatScore: 4.7,
    evaluatedPercentage: 85.1,
  }

  // Se estamos em preview, sempre use os dados mockados
  const displayStats = isPreview ? mockStats : stats

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-full max-w-[120px]" />
                <Skeleton className="mt-2 h-4 w-full max-w-[180px]" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  // Para evitar erros, caso stats seja nulo ou undefined
  if (!displayStats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhum atendimento encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayStats.totalTickets.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Soma de todos os tickets abertos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolvidos no Primeiro Atendimento</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayStats.resolvedFirstContact.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {((displayStats.resolvedFirstContact / displayStats.totalTickets) * 100).toFixed(1)}% do total de
            atendimentos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Não Resolvidos no Primeiro Atendimento</CardTitle>
          <XCircle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayStats.notResolvedFirstContact.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {((displayStats.notResolvedFirstContact / displayStats.totalTickets) * 100).toFixed(1)}% do total de
            atendimentos
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
