"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, TrendingUp, Target, AlertCircle, CheckCircle } from "lucide-react"
import type { ConsultingProject } from "@/lib/types"

interface BonificationAnalysisProps {
  projects: ConsultingProject[]
  isLoading: boolean
}

export function BonificationAnalysis({ projects, isLoading }: BonificationAnalysisProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Análise geral de bonificação
  const totalProjects = projects.length
  const bonifiedProjects = projects.filter((p) => p.bonificada === true)
  const nonBonifiedProjects = projects.filter((p) => p.bonificada === false || p.bonificada === null)

  const bonificationRate = totalProjects > 0 ? (bonifiedProjects.length / totalProjects) * 100 : 0
  const bonifiedRevenue = bonifiedProjects.reduce((sum, p) => sum + (p.valor_consultoria || 0), 0)
  const nonBonifiedRevenue = nonBonifiedProjects.reduce((sum, p) => sum + (p.valor_consultoria || 0), 0)
  const totalRevenue = bonifiedRevenue + nonBonifiedRevenue

  // Análise por consultor
  const consultorBonification = projects.reduce(
    (acc, project) => {
      const consultor = project.consultor || "Não atribuído"
      if (!acc[consultor]) {
        acc[consultor] = {
          consultor,
          total: 0,
          bonificados: 0,
          receitaBonificada: 0,
          receitaTotal: 0,
          taxa: 0,
        }
      }

      acc[consultor].total += 1
      acc[consultor].receitaTotal += project.valor_consultoria || 0

      if (project.bonificada) {
        acc[consultor].bonificados += 1
        acc[consultor].receitaBonificada += project.valor_consultoria || 0
      }

      return acc
    },
    {} as Record<string, any>,
  )

  const consultorData = Object.values(consultorBonification)
    .map((stats: any) => {
      stats.taxa = stats.total > 0 ? (stats.bonificados / stats.total) * 100 : 0
      return stats
    })
    .sort((a, b) => b.taxa - a.taxa)

  // Análise por tipo
  const typeBonification = projects.reduce(
    (acc, project) => {
      const tipo = project.tipo || "Não especificado"
      if (!acc[tipo]) {
        acc[tipo] = {
          tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
          total: 0,
          bonificados: 0,
          taxa: 0,
        }
      }

      acc[tipo].total += 1
      if (project.bonificada) {
        acc[tipo].bonificados += 1
      }

      return acc
    },
    {} as Record<string, any>,
  )

  const typeData = Object.values(typeBonification).map((stats: any) => {
    stats.taxa = stats.total > 0 ? (stats.bonificados / stats.total) * 100 : 0
    return stats
  })

  // Análise por porte
  const porteBonification = projects.reduce(
    (acc, project) => {
      const porte = project.porte || "Não especificado"
      if (!acc[porte]) {
        acc[porte] = {
          porte: porte.charAt(0).toUpperCase() + porte.slice(1),
          total: 0,
          bonificados: 0,
          taxa: 0,
        }
      }

      acc[porte].total += 1
      if (project.bonificada) {
        acc[porte].bonificados += 1
      }

      return acc
    },
    {} as Record<string, any>,
  )

  const porteData = Object.values(porteBonification).map((stats: any) => {
    stats.taxa = stats.total > 0 ? (stats.bonificados / stats.total) * 100 : 0
    return stats
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const pieData = [
    { name: "Bonificados", value: bonifiedProjects.length, color: "#00C49F" },
    { name: "Não Bonificados", value: nonBonifiedProjects.length, color: "#FF8042" },
  ]

  const getBonificationBadge = (taxa: number) => {
    if (taxa >= 70) {
      return <Badge className="bg-green-100 text-green-800">Excelente</Badge>
    } else if (taxa >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800">Bom</Badge>
    } else if (taxa >= 30) {
      return <Badge className="bg-orange-100 text-orange-800">Regular</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800">Baixo</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Bonificação</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bonificationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {bonifiedProjects.length} de {totalProjects} projetos
            </p>
            <div className="mt-2">{getBonificationBadge(bonificationRate)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bonificada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(bonifiedRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? ((bonifiedRevenue / totalRevenue) * 100).toFixed(1) : 0}% da receita total
            </p>
            <div className="mt-2">
              <Badge variant="outline">
                {formatCurrency(bonifiedRevenue / (bonifiedProjects.length || 1))} por projeto
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impacto Financeiro</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(bonifiedRevenue - nonBonifiedRevenue)}</div>
            <p className="text-xs text-muted-foreground">Diferença vs. não bonificados</p>
            <div className="mt-2">
              {bonifiedRevenue > nonBonifiedRevenue ? (
                <Badge className="bg-green-100 text-green-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Positivo
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Negativo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição Geral */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Bonificação</CardTitle>
            <CardDescription>Proporção de projetos bonificados vs. não bonificados</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                bonificados: { label: "Bonificados", color: "#00C49F" },
                naoBonificados: { label: "Não Bonificados", color: "#FF8042" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Bonificação por Consultor</CardTitle>
            <CardDescription>Performance de bonificação por consultor</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                taxa: { label: "Taxa (%)", color: "hsl(var(--chart-1))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultorData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="consultor" type="category" width={100} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Taxa"]}
                  />
                  <Bar dataKey="taxa" fill="var(--color-taxa)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Tipo e Porte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bonificação por Tipo de Projeto</CardTitle>
            <CardDescription>Taxa de bonificação por tipo de consultoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                taxa: { label: "Taxa (%)", color: "hsl(var(--chart-2))" },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Taxa"]}
                  />
                  <Bar dataKey="taxa" fill="var(--color-taxa)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bonificação por Porte</CardTitle>
            <CardDescription>Taxa de bonificação por porte do projeto</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                taxa: { label: "Taxa (%)", color: "hsl(var(--chart-3))" },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porteData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="porte" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Taxa"]}
                  />
                  <Bar dataKey="taxa" fill="var(--color-taxa)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada de Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Detalhada por Consultor</CardTitle>
          <CardDescription>Análise completa de bonificação e receita por consultor</CardDescription>
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
                      {consultor.total} projeto{consultor.total !== 1 ? "s" : ""} total
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="font-semibold">{consultor.bonificados}</div>
                    <div className="text-xs text-muted-foreground">Bonificados</div>
                  </div>
                  <div>
                    <div className="font-semibold">{consultor.taxa.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Taxa</div>
                  </div>
                  <div>
                    <div className="font-semibold">{formatCurrency(consultor.receitaBonificada)}</div>
                    <div className="text-xs text-muted-foreground">Receita Bonificada</div>
                  </div>
                  <div>{getBonificationBadge(consultor.taxa)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
          <CardDescription>Análise estratégica baseada nos dados de bonificação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Pontos Fortes
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>
                    Taxa de bonificação de {bonificationRate.toFixed(1)}%
                    {bonificationRate >= 50 ? " está acima da média" : " tem potencial de melhoria"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <span>
                    Receita bonificada representa{" "}
                    {totalRevenue > 0 ? ((bonifiedRevenue / totalRevenue) * 100).toFixed(1) : 0}% do total
                  </span>
                </li>
                {consultorData.length > 0 && consultorData[0].taxa >= 70 && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>
                      {consultorData[0].consultor} lidera com {consultorData[0].taxa.toFixed(1)}% de bonificação
                    </span>
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Oportunidades de Melhoria
              </h4>
              <ul className="space-y-2 text-sm">
                {bonificationRate < 50 && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <span>Aumentar taxa geral de bonificação para pelo menos 50%</span>
                  </li>
                )}
                {consultorData.some((c) => c.taxa < 30) && (
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <span>
                      Consultores com baixa taxa precisam de suporte:{" "}
                      {consultorData
                        .filter((c) => c.taxa < 30)
                        .map((c) => c.consultor)
                        .join(", ")}
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <span>Analisar critérios de bonificação para otimizar resultados</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <span>Implementar programa de incentivos para melhorar performance</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
