"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getConsultantCommissions } from "@/lib/completed-consulting-service"

interface ConsultantCommissionChartProps {
  consultores: string[]
  startDate?: string
  endDate?: string
}

export function ConsultantCommissionChart({ consultores, startDate, endDate }: ConsultantCommissionChartProps) {
  const [data, setData] = useState<{ consultor: string; totalComissao: number; projetosCount: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const commissionsData = await getConsultantCommissions(consultores, startDate, endDate)
        setData(commissionsData)
      } catch (error) {
        console.error("Error fetching consultant commissions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (consultores.length > 0) {
      fetchData()
    } else {
      setData([])
      setIsLoading(false)
    }
  }, [consultores, startDate, endDate])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comissões por Consultor</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando dados de comissões...</p>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comissões por Consultor</CardTitle>
          <CardDescription>Nenhum dado disponível para o período selecionado</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado de comissão encontrado</p>
        </CardContent>
      </Card>
    )
  }

  // Ordenar por valor total de comissão (maior para menor)
  const sortedData = [...data].sort((a, b) => b.totalComissao - a.totalComissao)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comissões por Consultor</CardTitle>
        <CardDescription>Total de comissões recebidas por cada consultor</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="consultor" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, "Comissão"]}
              labelFormatter={(label) => `Consultor: ${label}`}
            />
            <Bar dataKey="totalComissao" name="Comissão" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
