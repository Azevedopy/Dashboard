"use client"

import { useState, useEffect, useRef } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useResizeObserver } from "@/hooks/use-resize-observer"
import { format } from "date-fns"

// Array de cores para as linhas dos diferentes membros
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

interface MetricsLineChartProps {
  metrics: any[]
  isLoading: boolean
  metricType: string
  referenceValue?: number
  referenceLabel?: string
  yAxisFormatter?: (value: number) => string
  tooltipFormatter?: (value: number) => string
  domain?: [number | string, number | string]
  onMemberToggle?: (member: string) => void
}

export function MetricsLineChart({
  metrics,
  isLoading,
  metricType,
  referenceValue,
  referenceLabel,
  yAxisFormatter = (value) => `${value}`,
  tooltipFormatter = (value) => `${value}`,
  domain,
  onMemberToggle,
}: MetricsLineChartProps) {
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
  const processedData = metrics
    .map((item) => ({
      date: item.date,
      value: item[metricType] || 0,
      member: item.member || "Desconhecido",
      memberId: item.member_id || "unknown",
    }))
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })
    .map((item) => ({
      ...item,
      formattedDate: format(new Date(item.date), "dd/MM"),
    }))

  // Agrupar por data para criar a estrutura do gráfico
  const dateGroups = processedData.reduce((acc, item) => {
    if (!acc[item.formattedDate]) {
      acc[item.formattedDate] = {
        date: item.formattedDate,
        members: {},
      }
    }

    // Armazenar o valor para cada membro nesta data
    if (!acc[item.formattedDate].members[item.member]) {
      acc[item.formattedDate].members[item.member] = {
        total: item.value,
        count: 1,
      }
    } else {
      acc[item.formattedDate].members[item.member].total += item.value
      acc[item.formattedDate].members[item.member].count += 1
    }

    return acc
  }, {})

  // Converter para o formato esperado pelo Recharts
  const chartData = Object.values(dateGroups).map((group: any) => {
    const result: any = { date: group.date }

    // Calcular a média para cada membro nesta data
    Object.entries(group.members).forEach(([member, data]: [string, any]) => {
      result[member] = data.total / data.count
    })

    return result
  })

  // Obter a lista única de membros para criar as linhas
  const uniqueMembers = Array.from(new Set(processedData.map((item) => item.member))).filter(Boolean)

  // Inicializar o estado de visibilidade dos membros quando a lista de membros mudar
  useEffect(() => {
    const initialVisibility = uniqueMembers.reduce(
      (acc, member) => {
        acc[member] = true
        return acc
      },
      {} as Record<string, boolean>,
    )

    setVisibleMembers(initialVisibility)
  }, [JSON.stringify(uniqueMembers)])

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
  const CustomLegend = (props: any) => {
    // Verificar se payload existe e é um array antes de usar map
    const payload = props.payload || []

    if (!payload || payload.length === 0) {
      return null
    }

    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <li
            key={`item-${index}`}
            className="flex items-center cursor-pointer"
            onClick={() => toggleMemberVisibility(entry.value)}
          >
            <div
              className="w-3 h-3 mr-2 rounded-full"
              style={{
                backgroundColor: entry.color,
              }}
            />
            <span
              style={{
                color: "#6b7280",
              }}
            >
              {entry.value}
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

  const metricName =
    metricType === "average_response_time"
      ? "Tempo Médio (min)"
      : metricType === "resolution_rate"
        ? "Taxa de Resolução (%)"
        : metricType

  return (
    <div ref={containerRef} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
            tickFormatter={yAxisFormatter}
            domain={domain || ["auto", "auto"]}
          />
          <Tooltip
            formatter={(value, name) => [tooltipFormatter(value as number), name]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              color: "#111827",
            }}
          />
          <Legend content={<CustomLegend />} />

          {/* Renderizar uma linha para cada membro */}
          {uniqueMembers.map((member, index) => (
            <Line
              key={member}
              type="monotone"
              dataKey={member}
              name={member}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}

          {referenceValue !== undefined && (
            <ReferenceLine
              y={referenceValue}
              stroke="#ff4500"
              strokeDasharray="3 3"
              label={{
                value: referenceLabel || `Meta: ${referenceValue}`,
                position: "insideBottomRight",
                fill: "#ff4500",
                fontSize: 12,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
