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
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getAgentColor } from "@/lib/agent-colors"

// Função para formatar minutos para exibição
const formatMinutes = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }
  return `${minutes} min`
}

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
    .map((item) => {
      // Verificar se a data é válida
      let dateObj
      try {
        // Usar a data exatamente como está, sem ajustes de fuso horário
        dateObj = parseISO(item.date)

        // Verificar se a data é válida
        if (isNaN(dateObj.getTime())) {
          console.error(`Data inválida: ${item.date}`)
          return null
        }

        // Usar o valor exato do banco de dados sem transformações
        const metricValue = Number(item[metricType]) || 0

        return {
          date: item.date,
          value: metricValue,
          member: item.member || "Desconhecido",
          memberId: item.member_id || "unknown",
          // Usar a data sem ajustes de fuso horário
          dateObj: dateObj,
          // Formatar a data no padrão brasileiro (dia/mês)
          formattedDate: format(dateObj, "dd/MM", { locale: ptBR }),
        }
      } catch (error) {
        console.error(`Erro ao processar data: ${item.date}`, error)
        return null
      }
    })
    .filter(Boolean) // Remover itens nulos
    .sort((a, b) => {
      return a.dateObj.getTime() - b.dateObj.getTime()
    })

  // IMPORTANTE: Não calcular média para o mesmo dia/membro
  // Em vez disso, criar um objeto onde cada combinação de data+membro tem seu próprio valor
  const chartData = processedData.reduce((acc, item) => {
    // Criar uma chave única para cada combinação de data e membro
    const dateKey = item.formattedDate

    // Se esta data ainda não existe no acumulador, criar um novo objeto para ela
    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey }
    }

    // Adicionar o valor diretamente para este membro nesta data
    // Sem calcular média, usar o valor exato
    acc[dateKey][item.member] = item.value

    return acc
  }, {})

  // Converter o objeto para um array para o Recharts
  const finalChartData = Object.values(chartData)

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

  // Personalizar formatadores com base no tipo de métrica
  const customYAxisFormatter = (value: number) => {
    if (metricType === "average_response_time") {
      return formatMinutes(value)
    }
    return yAxisFormatter(value)
  }

  const customTooltipFormatter = (value: number, name: string) => {
    if (metricType === "average_response_time") {
      return [formatMinutes(value), name]
    }
    return [tooltipFormatter(value), name]
  }

  const metricName =
    metricType === "average_response_time"
      ? "Tempo de Atendimento"
      : metricType === "resolution_rate"
        ? "Taxa de Resolução (%)"
        : metricType

  return (
    <div ref={containerRef} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={finalChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
            tickFormatter={customYAxisFormatter}
            domain={domain || ["auto", "auto"]}
          />
          <Tooltip
            formatter={customTooltipFormatter}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              color: "#111827",
            }}
          />
          <Legend content={<CustomLegend />} />

          {/* Renderizar uma linha para cada membro com cores fixas */}
          {uniqueMembers.map((member) => (
            <Line
              key={member}
              type="monotone"
              dataKey={member}
              name={member}
              stroke={getAgentColor(member)}
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
