"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { format, parseISO, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ConsultingProject } from "@/lib/types"

interface RevenueAnalysisChartProps {
  projects: ConsultingProject[]
  isLoading: boolean
  detailed?: boolean
}

export function RevenueAnalysisChart({ projects, isLoading, detailed = false }: RevenueAnalysisChartProps) {
  if (isLoading) {
    return (
      <div className={`grid gap-6 ${detailed ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        {!detailed && (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Agrupar dados por mês
  const monthlyData = projects.reduce(
    (acc, project) => {
      if (!project.data_finalizacao) return acc

      const monthKey = format(startOfMonth(parseISO(project.data_finalizacao)), "yyyy-MM")
      const monthLabel = format(startOfMonth(parseISO(project.data_finalizacao)), "MMM/yy", { locale: ptBR })

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthLabel,
          receita: 0,
          comissoes: 0,
          liquida: 0,
          projetos: 0,
          consultoria: 0,
          upsell: 0,
        }
      }

      acc[monthKey].receita += project.valor_consultoria || 0
      acc[monthKey].comissoes += project.valor_comissao || 0
      acc[monthKey].liquida += (project.valor_consultoria || 0) - (project.valor_comissao || 0)
      acc[monthKey].projetos += 1

      if (project.tipo === "consultoria") {
        acc[monthKey].consultoria += project.valor_consultoria || 0
      } else if (project.tipo === "upsell") {
        acc[monthKey].upsell += project.valor_consultoria || 0
      }

      return acc
    },
    {} as Record<string, any>,
  )

  const chartData = Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month))

  // Dados por tipo
  const typeData = projects.reduce(
    (acc, project) => {
      const tipo = project.tipo || "Não especificado"
      if (!acc[tipo]) {
        acc[tipo] = { tipo, receita: 0, projetos: 0 }
      }
      acc[tipo].receita += project.valor_consultoria || 0
      acc[tipo].projetos += 1
      return acc
    },
    {} as Record<string, any>,
  )

  const typeChartData = Object.values(typeData)

  // Dados por porte
  const porteData = projects.reduce(
    (acc, project) => {
      const porte = project.porte || "Não especificado"
      if (!acc[porte]) {
        acc[porte] = { porte, receita: 0, projetos: 0 }
      }
      acc[porte].receita += project.valor_consultoria || 0
      acc[porte].projetos += 1
      return acc
    },
    {} as Record<string, any>,
  )

  const porteChartData = Object.values(porteData)

  const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (detailed) {
    return (
      <div className="space-y-6">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Receita por Mês</CardTitle>
            <CardDescription>Análise temporal da receita bruta, líquida e comissões</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                receita: { label: "Receita Bruta", color: "hsl(var(--chart-1))" },
                liquida: { label: "Receita Líquida", color: "hsl(var(--chart-2))" },
                comissoes: { label: "Comissões", color: "hsl(var(--chart-3))" },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [formatCurrency(value), ""]}
                  />
                  <Line type="monotone" dataKey="receita" stroke="var(--color-receita)" strokeWidth={3} />
                  <Line type="monotone" dataKey="liquida" stroke="var(--color-liquida)" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="comissoes"
                    stroke="var(--color-comissoes)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Análise por Tipo e Porte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Tipo de Projeto</CardTitle>
              <CardDescription>Distribuição da receita entre consultorias e upsells</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  receita: { label: "Receita", color: "hsl(var(--chart-1))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [formatCurrency(value), "Receita"]}
                    />
                    <Bar dataKey="receita" fill="var(--color-receita)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receita por Porte</CardTitle>
              <CardDescription>Distribuição da receita por tamanho do projeto</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  receita: { label: "Receita", color: "hsl(var(--chart-2))" },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porteChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="porte" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [formatCurrency(value), "Receita"]}
                    />
                    <Bar dataKey="receita" fill="var(--color-receita)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Estatístico */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Estatístico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(chartData.reduce((sum: number, item: any) => sum + item.receita, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Receita Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(chartData.reduce((sum: number, item: any) => sum + item.liquida, 0))}
                </div>
                <div className="text-sm text-muted-foreground">Receita Líquida</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {chartData.reduce((sum: number, item: any) => sum + item.projetos, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total de Projetos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    chartData.length > 0
                      ? chartData.reduce((sum: number, item: any) => sum + item.receita, 0) / chartData.length
                      : 0,
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Receita Média/Mês</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Receita</CardTitle>
        <CardDescription>Evolução mensal da receita e distribuição por tipo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            receita: { label: "Receita Bruta", color: "hsl(var(--chart-1))" },
            liquida: { label: "Receita Líquida", color: "hsl(var(--chart-2))" },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) => [formatCurrency(value), ""]}
              />
              <Line type="monotone" dataKey="receita" stroke="var(--color-receita)" strokeWidth={2} />
              <Line type="monotone" dataKey="liquida" stroke="var(--color-liquida)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
