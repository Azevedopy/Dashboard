"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { getConsultantCommissions } from "@/lib/completed-consulting-service"

interface ConsultantCommissionChartProps {
  consultores: string[]
  startDate?: string
  endDate?: string
}

export function ConsultantCommissionChart({ consultores, startDate, endDate }: ConsultantCommissionChartProps) {
  const [data, setData] = useState<{ consultor: string; totalComissao: number; projetosCount: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar se estamos em ambiente de preview
  const isPreview =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") || window.location.hostname === "localhost")

  useEffect(() => {
    async function fetchData() {
      console.log("📊 Carregando dados do gráfico de comissões...")
      setIsLoading(true)
      setError(null)

      try {
        // Garantir que consultores é um array válido
        const safeConsultores = Array.isArray(consultores) ? consultores.filter(Boolean) : []

        if (safeConsultores.length === 0) {
          console.log("⚠️ Nenhum consultor disponível")
          setData([])
          return
        }

        console.log("👥 Buscando comissões para consultores:", safeConsultores)
        const commissionData = await getConsultantCommissions(safeConsultores, startDate, endDate)

        console.log("✅ Dados de comissão recebidos:", commissionData)
        setData(commissionData)
      } catch (error) {
        console.error("❌ Erro ao buscar comissões:", error)
        setError("Erro ao carregar dados de comissões")

        // Fallback com dados vazios
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [consultores, startDate, endDate])

  // Cores para as barras
  const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

  // Formatar o tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-md shadow-lg">
          <p className="font-medium text-gray-900">{data.consultor}</p>
          <p className="text-sm text-gray-600">Total: {formatCurrency(data.totalComissao)}</p>
          <p className="text-sm text-gray-600">Projetos: {data.projetosCount}</p>
          <p className="text-sm text-gray-600">
            Média: {formatCurrency(data.totalComissao / (data.projetosCount || 1))}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Comissões por Consultor
              {isPreview && (
                <Badge variant="outline" className="text-xs">
                  DEMO
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {data.length > 0
                ? `Total de comissões recebidas por ${data.length} consultor${data.length > 1 ? "es" : ""}`
                : "Nenhum dado de comissão disponível"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-[350px] w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[350px] text-red-500">
            <div className="text-center">
              <p className="font-medium">⚠️ {error}</p>
              <p className="text-sm text-muted-foreground mt-1">Tente recarregar a página</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            <div className="text-center">
              <p className="font-medium">📊 Nenhum dado disponível</p>
              <p className="text-sm mt-1">Não há dados de comissão para o período selecionado</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="consultor"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} width={80} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalComissao" name="Comissão Total" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
