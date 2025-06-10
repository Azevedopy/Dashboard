"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts"
import { format, subDays, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getAgentColor } from "@/lib/agent-colors"

interface MetricsBarChartProps {
  metrics: any[]
  isLoading: boolean
  metricType: string
  referenceValue?: number
  referenceLabel?: string
  yAxisFormatter?: (value: number) => string
  tooltipFormatter?: (value: number) => string
  domain?: [number, number | string]
  onMemberToggle?: (member: string) => void
}

export function MetricsBarChart({
  metrics,
  isLoading,
  metricType,
  referenceValue,
  referenceLabel,
  yAxisFormatter = (value) => value.toString(),
  tooltipFormatter = (value) => value.toString(),
  domain = [0, "auto"],
  onMemberToggle,
}: MetricsBarChartProps) {
  // Determinar se devemos usar o novo formato (dia a dia com agentes)
  const shouldShowDailyByAgent = metricType === "evaluated_percentage" || metricType === "csat_score"

  const { chartData, uniqueAgents } = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      if (shouldShowDailyByAgent) {
        // Gerar dados vazios para os últimos 30 dias sem agentes
        const today = new Date()
        const startDate = subDays(today, 29) // 30 dias incluindo hoje
        const dateRange = eachDayOfInterval({ start: startDate, end: today })

        return {
          chartData: dateRange.map((date) => ({
            date: format(date, "yyyy-MM-dd"),
            displayDate: format(date, "dd/MM", { locale: ptBR }),
            fullDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
          })),
          uniqueAgents: [],
        }
      } else {
        // Gerar dados vazios para os últimos 30 dias (formato original)
        const today = new Date()
        const startDate = subDays(today, 29) // 30 dias incluindo hoje
        const dateRange = eachDayOfInterval({ start: startDate, end: today })

        return {
          chartData: dateRange.map((date) => ({
            date: format(date, "yyyy-MM-dd"),
            displayDate: format(date, "dd/MM", { locale: ptBR }),
            fullDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
            [metricType]: 0,
            hasData: false,
          })),
          uniqueAgents: [],
        }
      }
    }

    // Se estamos mostrando dados diários por agente
    if (shouldShowDailyByAgent) {
      // Obter lista única de agentes
      const agents = Array.from(new Set(metrics.map((metric) => metric.member || "Desconhecido"))).sort()

      // Gerar range completo dos últimos 30 dias
      const today = new Date()
      const startDate = subDays(today, 29) // 30 dias incluindo hoje
      const dateRange = eachDayOfInterval({ start: startDate, end: today })

      // Criar mapa dos dados existentes por data e agente
      const dataByDateAndAgent = new Map()
      metrics.forEach((metric) => {
        const date = metric.date
        const agent = metric.member || "Desconhecido"
        const key = `${date}_${agent}`

        if (!dataByDateAndAgent.has(key)) {
          dataByDateAndAgent.set(key, [])
        }
        dataByDateAndAgent.get(key).push(metric)
      })

      // Gerar dados para todos os 30 dias
      const dailyData = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        const dayData = {
          date: dateStr,
          displayDate: format(date, "dd/MM", { locale: ptBR }),
          fullDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
        }

        // Para cada agente, calcular o valor do dia
        agents.forEach((agent) => {
          const key = `${dateStr}_${agent}`
          const agentDayData = dataByDateAndAgent.get(key) || []

          let value = 0
          let hasData = false

          if (agentDayData.length > 0) {
            // Calcular média dos valores do agente no dia
            const values = agentDayData.map((item) => Number(item[metricType] || 0)).filter((v) => !isNaN(v))
            if (values.length > 0) {
              value = values.reduce((sum, v) => sum + v, 0) / values.length
              hasData = true
            }
          }

          dayData[agent] = Number(value.toFixed(2))
          dayData[`${agent}_hasData`] = hasData
          dayData[`${agent}_count`] = agentDayData.length
        })

        return dayData
      })

      return {
        chartData: dailyData,
        uniqueAgents: agents,
      }
    } else {
      // Lógica original para outros tipos de métrica
      // Gerar range completo dos últimos 30 dias
      const today = new Date()
      const startDate = subDays(today, 29) // 30 dias incluindo hoje
      const dateRange = eachDayOfInterval({ start: startDate, end: today })

      // Criar mapa dos dados existentes por data
      const dataByDate = new Map()
      metrics.forEach((metric) => {
        const date = metric.date
        if (!dataByDate.has(date)) {
          dataByDate.set(date, [])
        }
        dataByDate.get(date).push(metric)
      })

      // Gerar dados para todos os 30 dias
      return {
        chartData: dateRange.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd")
          const dayData = dataByDate.get(dateStr) || []

          let value = 0
          let hasData = false

          if (dayData.length > 0) {
            // Calcular média dos valores do dia
            const values = dayData.map((item) => Number(item[metricType] || 0)).filter((v) => !isNaN(v))
            if (values.length > 0) {
              value = values.reduce((sum, v) => sum + v, 0) / values.length
              hasData = true
            }
          }

          return {
            date: dateStr,
            displayDate: format(date, "dd/MM", { locale: ptBR }),
            fullDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
            [metricType]: Number(value.toFixed(2)),
            hasData,
            count: dayData.length,
          }
        }),
        uniqueAgents: [],
      }
    }
  }, [metrics, metricType, shouldShowDailyByAgent])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      if (shouldShowDailyByAgent) {
        const data = payload[0].payload
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium mb-2">{data.fullDate}</p>
            {payload.map((entry, index) => {
              const agentName = entry.dataKey
              const count = data[`${agentName}_count`] || 0
              const hasData = data[`${agentName}_hasData`] || false

              return (
                <div key={index} className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm">
                    <strong>{agentName}:</strong> {tooltipFormatter(entry.value)}
                    {hasData ? ` (${count} registro${count > 1 ? "s" : ""})` : " (sem dados)"}
                  </span>
                </div>
              )
            })}
            {referenceValue && <p className="text-xs text-gray-500 mt-2">{referenceLabel}</p>}
          </div>
        )
      } else {
        const data = payload[0].payload
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium">{data.fullDate}</p>
            <p className="text-sm text-gray-600">
              {tooltipFormatter(payload[0].value)}
              {data.hasData ? ` (${data.count} registro${data.count > 1 ? "s" : ""})` : " (sem dados)"}
            </p>
            {referenceValue && <p className="text-xs text-gray-500 mt-1">{referenceLabel}</p>}
          </div>
        )
      }
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded" style={{ width: `${Math.random() * 100 + 50}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Nenhum dado disponível para exibição</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0} // Mostrar todos os dias
          />

          <YAxis
            tickFormatter={yAxisFormatter}
            tick={{ fontSize: 12 }}
            domain={domain}
            ticks={metricType === "csat_score" ? [1, 2, 3, 4, 5] : undefined}
          />

          <Tooltip content={<CustomTooltip />} />

          {shouldShowDailyByAgent && uniqueAgents.length > 0 && <Legend />}

          {referenceValue && (
            <ReferenceLine
              y={referenceValue}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{
                value: referenceLabel,
                position: "topRight",
                fill: "#ef4444",
                fontSize: 12,
              }}
            />
          )}

          {shouldShowDailyByAgent ? (
            // Renderizar uma barra para cada agente com cores fixas
            uniqueAgents.map((agent) => (
              <Bar
                key={agent}
                dataKey={agent}
                fill={getAgentColor(agent)}
                name={agent}
                radius={[2, 2, 0, 0]}
                onClick={() => onMemberToggle && onMemberToggle(agent)}
                style={{ cursor: onMemberToggle ? "pointer" : "default" }}
              />
            ))
          ) : (
            // Barra única para dados por data (outros tipos de métrica)
            <Bar
              dataKey={metricType}
              fill={(data) => (data.hasData ? "#3b82f6" : "#e5e7eb")}
              radius={[2, 2, 0, 0]}
              name={metricType}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-center">
        {shouldShowDailyByAgent ? null : (
          <p className="text-sm text-gray-600">
            Últimos 30 dias • {chartData.filter((d) => d.hasData).length} dias com dados
          </p>
        )}

        {shouldShowDailyByAgent ? (
          <div className="flex justify-center items-center gap-4 mt-2 flex-wrap">
            {uniqueAgents.map((agent) => (
              <div key={agent} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: getAgentColor(agent) }} />
                <span className="text-xs text-gray-600">{agent}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600">Com dados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span className="text-xs text-gray-600">Sem dados</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
