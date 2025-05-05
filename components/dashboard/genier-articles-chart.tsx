"use client"

import { useState, useEffect, useRef } from "react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useResizeObserver } from "@/hooks/use-resize-observer"
import { format } from "date-fns"

export function GenierArticlesChart({ data, isLoading }) {
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef(null)
  const { width } = useResizeObserver(containerRef)

  useEffect(() => {
    if (width) {
      setContainerWidth(width)
    }
  }, [width])

  // Processar dados para o gráfico
  const processedData = data
    .map((item) => ({
      date: item.date,
      articles: item.articles_published || 0,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })
    .map((item) => ({
      ...item,
      date: format(new Date(item.date), "dd/MM"),
    }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Nenhum dado disponível para exibição</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
          <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              color: "#111827",
            }}
          />
          <Legend wrapperStyle={{ color: "#6b7280" }} />
          <Line
            type="monotone"
            dataKey="articles"
            name="Artigos Publicados"
            stroke="#8884d8"
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
