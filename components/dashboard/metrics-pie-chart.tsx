"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { getAgentColor } from "@/lib/agent-colors"

interface MetricsPieChartProps {
  metrics: any[]
  isLoading: boolean
  metricType: string
  onMemberToggle?: (member: string) => void
}

export function MetricsPieChart({ metrics, isLoading, metricType, onMemberToggle }: MetricsPieChartProps) {
  const chartData = useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return []
    }

    // Agrupar métricas por membro
    const memberMap = new Map()

    metrics.forEach((metric) => {
      const memberName = metric.member || "Desconhecido"

      if (!memberMap.has(memberName)) {
        memberMap.set(memberName, {
          values: [],
          totalValue: 0,
          count: 0,
        })
      }

      // Só adicionar valores válidos
      const value = Number(metric[metricType] || 0)
      if (!isNaN(value) && value > 0) {
        memberMap.get(memberName).values.push(value)
        memberMap.get(memberName).totalValue += value
        memberMap.get(memberName).count += 1
      }
    })

    // Converter o mapa em um array de objetos para o gráfico
    return Array.from(memberMap.entries())
      .map(([member, data]) => {
        const avgValue = data.count > 0 ? data.totalValue / data.count : 0
        return {
          name: member,
          value: Number(avgValue.toFixed(2)),
          count: data.count,
          color: getAgentColor(member),
        }
      })
      .filter((item) => item.value > 0) // Só mostrar membros com dados
      .sort((a, b) => b.value - a.value) // Ordenar por valor decrescente
  }, [metrics, metricType])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            Valor: {data.value}
            {metricType === "average_response_time" && " min"}
            {(metricType === "resolution_rate" || metricType === "evaluated_percentage") && "%"}
          </p>
          <p className="text-xs text-gray-500">{data.count} registro(s)</p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">
          <div className="w-64 h-64 bg-gray-200 rounded-full mx-auto"></div>
          <div className="mt-4 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={(data) => onMemberToggle && onMemberToggle(data.name)}
            style={{ cursor: onMemberToggle ? "pointer" : "default" }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">{chartData.length} agentes com dados</p>
        <div className="flex justify-center items-center gap-4 mt-2 flex-wrap">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
