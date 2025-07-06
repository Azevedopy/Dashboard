"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ScatterChart, Scatter } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Crown } from "lucide-react"
import type { ConsultingProject } from "@/lib/types"

interface ConsultantPerformanceChartProps {
  projects: ConsultingProject[]
  isLoading: boolean
}

export function ConsultantPerformanceChart({ projects, isLoading }: ConsultantPerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Agrupar dados por consultor
  const consultorStats = projects.reduce(
    (acc, project) => {
      const consultor = project.consultor || "Não atribuído"
      if (!acc[consultor]) {
        acc[consultor] = {
          consultor,
          projetos: 0,
          receita: 0,
          comissoes: 0,
          liquida: 0,
          avaliacoes: [],
          avaliacaoMedia: 0,
          bonificados: 0,
          prazosAtingidos: 0,
          totalPrazos: 0,
          taxaPrazo: 0,
          taxaBonificacao: 0,
          ticketMedio: 0,
        }
      }

      acc[consultor].projetos += 1
      acc[consultor].receita += project.valor_consultoria || 0
      acc[consultor].comissoes += project.valor_comissao || 0
      acc[consultor].liquida = acc[consultor].receita - acc[consultor].comissoes

      if (project.avaliacao_estrelas && project.avaliacao_estrelas > 0) {
        acc[consultor].avaliacoes.push(project.avaliacao_estrelas)
      }

      if (project.bonificada) {
        acc[consultor].bonificados += 1
      }

      if (project.prazo_atingido !== null) {
        acc[consultor].totalPrazos += 1
        if (project.prazo_atingido) {
          acc[consultor].prazosAtingidos += 1
        }
      }

      return acc
    },
    {} as Record<string, any>,
  )

  // Calcular métricas finais
  const consultorData = Object.values(consultorStats)
    .map((stats: any) => {
      stats.avaliacaoMedia =
        stats.avaliacoes.length > 0
          ? stats.avaliacoes.reduce((a: number, b: number) => a + b, 0) / stats.avaliacoes.length
          : 0
      stats.taxaPrazo = stats.totalPrazos > 0 ? (stats.prazosAtingidos / stats.totalPrazos) * 100 : 0
      stats.taxaBonificacao = stats.projetos > 0 ? (stats.bonificados / stats.projetos) * 100 : 0
      stats.ticketMedio = stats.projetos > 0 ? stats.receita / stats.projetos : 0
      return stats
    })
    .sort((a, b) => b.receita - a.receita)

  const topPerformer = consultorData[0]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getPerformanceBadge = (consultor: any) => {
    const score = consultor.avaliacaoMedia * 20 + consultor.taxaPrazo * 0.5 + consultor.taxaBonificacao * 0.3

    if (score >= 85) {
      return <Badge className="bg-green-100 text-green-800">Excelente</Badge>
    } else if (score >= 70) {
      return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Atenção</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Performer Card */}
      {topPerformer && (
        <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Top Performer
            </CardTitle>
            <CardDescription>Consultor com melhor performance geral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-yellow-700">{topPerformer.consultor}</div>
                <div className="text-sm text-muted-foreground">Consultor</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(topPerformer.receita)}</div>
                <div className="text-sm text-muted-foreground">Receita Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{topPerformer.projetos}</div>
                <div className="text-sm text-muted-foreground">Projetos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {topPerformer.avaliacaoMedia > 0 ? `${topPerformer.avaliacaoMedia.toFixed(1)} ⭐` : "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">Avaliação</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Receita por Consultor */}
      <Card>
        <CardHeader>
          <CardTitle>Receita por Consultor</CardTitle>
          <CardDescription>Comparação de receita bruta e líquida entre consultores</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              receita: { label: "Receita Bruta", color: "hsl(var(--chart-1))" },
              liquida: { label: "Receita Líquida", color: "hsl(var(--chart-2))" },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consultorData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="consultor" type="category" width={120} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
                <Bar dataKey="receita" fill="var(--color-receita)" />
                <Bar dataKey="liquida" fill="var(--color-liquida)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Análise de Eficiência */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Eficiência</CardTitle>
          <CardDescription>Relação entre número de projetos e receita média</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              efficiency: { label: "Eficiência", color: "hsl(var(--chart-3))" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={consultorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="projetos" name="Projetos" />
                <YAxis dataKey="ticketMedio" name="Ticket Médio" tickFormatter={(value) => formatCurrency(value)} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number, name: string) => [
                    name === "ticketMedio" ? formatCurrency(value) : value,
                    name === "projetos" ? "Projetos" : "Ticket Médio",
                  ]}
                />
                <Scatter dataKey="ticketMedio" fill="var(--color-efficiency)" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Ranking Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Detalhado de Performance</CardTitle>
          <CardDescription>Análise completa de métricas por consultor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consultorData.map((consultor, index) => (
              <div key={consultor.consultor} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{consultor.consultor}</div>
                    <div className="text-sm text-muted-foreground">
                      {consultor.projetos} projeto{consultor.projetos !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="font-semibold">{formatCurrency(consultor.receita)}</div>
                    <div className="text-xs text-muted-foreground">Receita</div>
                  </div>
                  <div>
                    <div className="font-semibold">{formatCurrency(consultor.ticketMedio)}</div>
                    <div className="text-xs text-muted-foreground">Ticket Médio</div>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {consultor.avaliacaoMedia > 0 ? `${consultor.avaliacaoMedia.toFixed(1)} ⭐` : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground">Avaliação</div>
                  </div>
                  <div>
                    <div className="font-semibold">{consultor.taxaPrazo.toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">Taxa Prazo</div>
                  </div>
                  <div>{getPerformanceBadge(consultor)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
