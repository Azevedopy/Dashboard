"use client"

import { useState, useEffect } from "react"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"
import { Skeleton } from "@/components/ui/skeleton"

// Registrar componentes do Chart.js e o plugin datalabels
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels)

interface ConsultoriaPieChartProps {
  data: any[]
  isLoading: boolean
  groupByField: string
  title: string
}

export function ConsultoriaPieChart({ data, isLoading, groupByField, title }: ConsultoriaPieChartProps) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  })

  useEffect(() => {
    if (!data || data.length === 0) return

    try {
      // Agrupar dados pelo campo especificado
      const groupedData = data.reduce((acc, item) => {
        // Garantir que o valor não seja undefined ou null
        const key = item[groupByField] || "Não especificado"

        if (!acc[key]) {
          acc[key] = 0
        }
        acc[key] += 1
        return acc
      }, {})

      // Preparar dados para o gráfico
      const labels = Object.keys(groupedData)
      const values = Object.values(groupedData)
      const total = values.reduce((sum: number, value: number) => sum + value, 0)

      // Gerar cores para cada categoria
      const backgroundColors = [
        "rgba(53, 162, 235, 0.5)",
        "rgba(255, 99, 132, 0.5)",
        "rgba(75, 192, 192, 0.5)",
        "rgba(255, 206, 86, 0.5)",
        "rgba(153, 102, 255, 0.5)",
        "rgba(255, 159, 64, 0.5)",
        "rgba(54, 162, 235, 0.5)",
        "rgba(255, 99, 132, 0.5)",
        "rgba(75, 192, 192, 0.5)",
        "rgba(255, 206, 86, 0.5)",
      ]

      // Criar dataset para o gráfico
      const dataset = {
        label: title,
        data: values,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: backgroundColors.slice(0, labels.length).map((color) => color.replace("0.5", "1")),
        borderWidth: 1,
      }

      setChartData({
        labels,
        datasets: [dataset],
      })
    } catch (error) {
      console.error(`Error processing chart data for ${title}:`, error)
    }
  }, [data, groupByField, title])

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = Math.round(((value as number) / total) * 100)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
      // Configuração do plugin datalabels
      datalabels: {
        formatter: (value, ctx) => {
          const datapoints = ctx.chart.data.datasets[0].data
          const total = datapoints.reduce((a: number, b: number) => a + b, 0)
          const percentage = Math.round((value / total) * 100)
          return percentage > 5 ? `${percentage}%` : "" // Só mostra se for maior que 5%
        },
        color: "#ffffff",
        font: {
          weight: "bold",
          size: 12,
        },
        textStrokeColor: "#000000",
        textStrokeWidth: 1,
        textShadowBlur: 5,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        align: "center",
        anchor: "center",
      },
    },
    layout: {
      padding: 10,
    },
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full">Nenhum dado disponível para exibição.</div>
  }

  return <Pie options={options} data={chartData} />
}
