"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Target } from "lucide-react"
import type { ConsultingProject } from "@/lib/types"

interface ProjectTypeDistributionProps {
  projects: ConsultingProject[]
  isLoading: boolean
}

export function ProjectTypeDistribution({ projects, isLoading }: ProjectTypeDistributionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
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

  // Análise por tipo
  const typeStats = projects.reduce(
    (acc, project) => {
      const tipo = project.tipo || "Não especificado"
      if (!acc[tipo]) {
        acc[tipo] = {
          tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
          quantidade: 0,
          receita: 0,
          comissoes: 0,
          liquida: 0,
          avaliacoes: [],
          bonificados: 0,
          ticketMedio: 0,
        }
      }

      acc[tipo].quantidade += 1
      acc[tipo].receita += project.valor_consultoria || 0
      acc[tipo].comissoes += project.valor_comissao || 0
      acc[tipo].liquida = acc[tipo].receita - acc[tipo].comissoes

      if (project.avaliacao_estrelas && project.avaliacao_estrelas > 0) {
        acc[tipo].avaliacoes.push(project.avaliacao_estrelas)
      }

      if (project.bonificada) {
        acc[tipo].bonificados += 1
      }

      return acc
    },
    {} as Record<string, any>,
  )

  const typeData = Object.values(typeStats).map((stats: any) => {
    stats.ticketMedio = stats.quantidade > 0 ? stats.receita / stats.quantidade : 0
    stats.avaliacaoMedia =
      stats.avaliacoes.length > 0
        ? stats.avaliacoes.reduce((a: number, b: number) => a + b, 0) / stats.avaliacoes.length
        : 0
    stats.taxaBonificacao = stats.quantidade > 0 ? (stats.bonificados / stats.quantidade) * 100 : 0
    return stats
  })

  // Análise por porte
  const porteStats = projects.reduce(
    (acc, project) => {
      const porte = project.porte || "Não especificado"
      if (!acc[porte]) {
        acc[porte] = {
          porte: porte.charAt(0).toUpperCase() + porte.slice(1),
          quantidade: 0,
          receita: 0,
          comissoes: 0,
          liquida: 0,
          avaliacoes: [],
          bonificados: 0,
          ticketMedio: 0,
        }
      }

      acc[porte].quantidade += 1
      acc[porte].receita += project.valor_consultoria || 0
      acc[porte].comissoes += project.valor_comissao || 0
      acc[porte].liquida = acc[porte].receita - acc[porte].comissoes

      if (project.avaliacao_estrelas && project.avaliacao_estrelas > 0) {
        acc[porte].avaliacoes.push(project.avaliacao_estrelas)
      }

      if (project.bonificada) {
        acc[porte].bonificados += 1
      }

      return acc
    },
    {} as Record<string, any>,
  )

  const porteData = Object.values(porteStats).map((stats: any) => {
    stats.ticketMedio = stats.quantidade > 0 ? stats.receita / stats.quantidade : 0
    stats.avaliacaoMedia =
      stats.avaliacoes.length > 0
        ? stats.avaliacoes.reduce((a: number, b: number) => a + b, 0) / stats.avaliacoes.length
        : 0
    stats.taxaBonificacao = stats.quantidade > 0 ? (stats.bonificados / stats.quantidade) * 100 : 0
    return stats
  })

  const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Gráficos de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
            <CardDescription>Proporção de projetos por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                quantidade: { label: "Quantidade", color: "hsl(var(--chart-1))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tipo, quantidade, percent }) => `${tipo}: ${quantidade} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
            <CardTitle>Distribuição por Porte</CardTitle>
            <CardDescription>Proporção de projetos por porte</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                quantidade: { label: "Quantidade", color: "hsl(var(--chart-2))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={porteData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ porte, quantidade, percent }) =>
                      `${porte}: ${quantidade} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {porteData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cards Detalhados por Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {typeData.map((type, index) => (
          <Card key={type.tipo} className="border-l-4" style={{ borderLeftColor: colors[index % colors.length] }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                {type.tipo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="font-semibold">{type.quantidade}</div>
                  <div className="text-muted-foreground">Projetos</div>
                </div>
                <div>
                  <div className="font-semibold">{formatCurrency(type.receita)}</div>
                  <div className="text-muted-foreground">Receita</div>
                </div>
                <div>
                  <div className="font-semibold">{formatCurrency(type.ticketMedio)}</div>
                  <div className="text-muted-foreground">Ticket Médio</div>
                </div>
                <div>
                  <div className="font-semibold">{type.taxaBonificacao.toFixed(0)}%</div>
                  <div className="text-muted-foreground">Bonificação</div>
                </div>
              </div>
              {type.avaliacaoMedia > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{type.avaliacaoMedia.toFixed(1)} ⭐</Badge>
                  <span className="text-sm text-muted-foreground">Avaliação média</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards Detalhados por Porte */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {porteData.map((porte, index) => (
          <Card
            key={porte.porte}
            className="border-l-4"
            style={{ borderLeftColor: colors[(index + 3) % colors.length] }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                {porte.porte}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projetos:</span>
                  <span className="font-semibold">{porte.quantidade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita:</span>
                  <span className="font-semibold">{formatCurrency(porte.receita)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Médio:</span>
                  <span className="font-semibold">{formatCurrency(porte.ticketMedio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonificação:</span>
                  <span className="font-semibold">{porte.taxaBonificacao.toFixed(0)}%</span>
                </div>
              </div>
              {porte.avaliacaoMedia > 0 && (
                <Badge variant="outline" className="w-full justify-center">
                  {porte.avaliacaoMedia.toFixed(1)} ⭐ Avaliação
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Análise Comparativa */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Comparativa de Receita</CardTitle>
          <CardDescription>Comparação de receita bruta e líquida por tipo e porte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Por Tipo</h4>
              <ChartContainer
                config={{
                  receita: { label: "Receita Bruta", color: "hsl(var(--chart-1))" },
                  liquida: { label: "Receita Líquida", color: "hsl(var(--chart-2))" },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Bar dataKey="receita" fill="var(--color-receita)" />
                    <Bar dataKey="liquida" fill="var(--color-liquida)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Por Porte</h4>
              <ChartContainer
                config={{
                  receita: { label: "Receita Bruta", color: "hsl(var(--chart-3))" },
                  liquida: { label: "Receita Líquida", color: "hsl(var(--chart-4))" },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porteData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="porte" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Bar dataKey="receita" fill="var(--color-receita)" />
                    <Bar dataKey="liquida" fill="var(--color-liquida)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
