"use client"

import { useState, useEffect, useRef } from "react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useResizeObserver } from "@/hooks/use-resize-observer"
import { format, parseISO } from "date-fns"

export function GenierAttendanceChart({ data, isLoading }) {
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef(null)
  const { width } = useResizeObserver(containerRef)

  useEffect(() => {
    if (width) {
      setContainerWidth(width)
    }
  }, [width])

  const formattedData = data.map((item) => ({
    ...item,
    date: format(parseISO(item.date), "dd/MM"),
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
        <BarChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
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
          <Bar dataKey="total" name="Total de Atendimentos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="resolved" name="Atendimentos Resolvidos" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="unresolved" name="Atendimentos Não Resolvidos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
