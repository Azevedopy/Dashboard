"use client"

import { useState, useEffect, useRef } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useResizeObserver } from "@/hooks/use-resize-observer"

// Array de cores para os diferentes membros
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088fe",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#a4de6c",
  "#d0ed57",
  "#83a6ed",
  "#8dd1e1",
  "#a4262c",
  "#ca5010",
  "#8764b8",
]

interface MetricsPieChartProps {
  metrics: any[]
  isLoading: boolean
  metricType: string
  onMemberToggle?: (member: string) => void
}

export function MetricsPieChart({ metrics, isLoading, metricType, onMemberToggle }: MetricsPieChartProps) {
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef(null)
  const { width } = useResizeObserver(containerRef)
  const [visibleMembers, setVisibleMembers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (width) {
      setContainerWidth(width)
    }
  }, [width])

  // Processar dados para o gráfico
  const processedData = metrics.reduce((acc, item) => {
    const memberName = item.member || "Desconhecido"
    const value = item[metricType] || 0

    if (!acc[memberName]) {
      acc[memberName] = {
        name: memberName,
        total: value,
        count: 1,
      }
    } else {
      acc[memberName].total += value
      acc[memberName].count += 1
    }

    return acc
  }, {})

  // Calcular a média para cada membro
  const chartData = Object.values(processedData).map((item: any) => ({
    name: item.name,
    value: item.total / item.count,
  }))

  // Ordenar os dados do maior para o menor valor
  chartData.sort((a: any, b: any) => b.value - a.value)

  // Inicializar o estado de visibilidade dos membros quando a lista de membros mudar
  useEffect(() => {
    if (chartData.length === 0) return

    const memberNames = chartData.map((item) => item.name)
    const initialVisibility = memberNames.reduce(
      (acc, member) => {
        acc[member] = true
        return acc
      },
      {} as Record<string, boolean>,
    )

    setVisibleMembers(initialVisibility)
  }, [JSON.stringify(chartData.map((item) => item.name))])

  // Função para alternar a visibilidade de um membro
  const toggleMemberVisibility = (member: string) => {
    if (onMemberToggle) {
      onMemberToggle(member)
    } else {
      setVisibleMembers((prev) => ({
        ...prev,
        [member]: !prev[member],
      }))
    }
  }

  // Componente personalizado para a legenda clicável
  const CustomLegend = () => {
    if (chartData.length === 0) {
      return null
    }

    return (
      <ul className="flex flex-col gap-2 mt-4">
        {chartData.map((entry, index) => (
          <li
            key={`item-${index}`}
            className="flex items-center cursor-pointer"
            onClick={() => toggleMemberVisibility(entry.name)}
          >
            <div
              className="w-3 h-3 mr-2 rounded-full"
              style={{
                backgroundColor: COLORS[index % COLORS.length],
              }}
            />
            <span
              style={{
                color: "#6b7280",
              }}
            >
              {entry.name}: {getTooltipFormatter(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (!metrics.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Nenhum dado disponível para exibição</p>
      </div>
    )
  }

  // Formatação específica para cada tipo de métrica
  const getTooltipFormatter = (value: number) => {
    switch (metricType) {
      case "average_response_time":
        return `${value.toFixed(1)} min`
      case "resolution_rate":
      case "evaluated_percentage":
        return `${value.toFixed(1)}%`
      case "csat_score":
        return value.toFixed(1)
      default:
        return value.toFixed(0)
    }
  }

  const getMetricLabel = () => {
    switch (metricType) {
      case "average_response_time":
        return "Tempo Médio"
      case "resolution_rate":
        return "Taxa de Resolução"
      case "evaluated_percentage":
        return "% Avaliados"
      case "csat_score":
        return "CSAT"
      case "resolved_tickets":
        return "Tickets Resolvidos"
      default:
        return metricType
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 h-full">
        <div className="col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {chartData.length > 0 && (
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={containerWidth < 500 ? 80 : 120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              )}
              <Tooltip
                formatter={(value) => [getTooltipFormatter(value as number), getMetricLabel()]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  color: "#111827",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center md:justify-start">
          <CustomLegend />
        </div>
      </div>
    </div>
  )
}
