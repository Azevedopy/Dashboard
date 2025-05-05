"use client"

import { useState, useEffect, useRef } from "react"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"
import { Skeleton } from "@/components/ui/skeleton"
import { useResizeObserver } from "@/hooks/use-resize-observer"

// Registrar componentes do Chart.js e o plugin datalabels
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels)

interface ResponsivePieChartProps {
  data: any[]
  isLoading: boolean
  groupByField: string
  title: string
  colorScheme?: "blue" | "green" | "purple" | "orange"
}

export function ResponsivePieChart({
  data,
  isLoading,
  groupByField,
  title,
  colorScheme = "blue",
}: ResponsivePieChartProps) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  })
  const chartRef = useRef(null)
  const containerRef = useRef(null)
  const { width } = useResizeObserver(containerRef)

  // Definir esquemas de cores
  const colorSchemes = {
    blue: [
      "rgba(53, 162, 235, 0.7)",
      "rgba(30, 136, 229, 0.7)",
      "rgba(25, 118, 210, 0.7)",
      "rgba(21, 101, 192, 0.7)",
      "rgba(13, 71, 161, 0.7)",
    ],
    green: [
      "rgba(76, 175, 80, 0.7)",
      "rgba(67, 160, 71, 0.7)",
      "rgba(56, 142, 60, 0.7)",
      "rgba(46, 125, 50, 0.7)",
      "rgba(27, 94, 32, 0.7)",
    ],
    purple: [
      "rgba(156, 39, 176, 0.7)",
      "rgba(142, 36, 170, 0.7)",
      "rgba(123, 31, 162, 0.7)",
      "rgba(106, 27, 154, 0.7)",
      "rgba(74, 20, 140, 0.7)",
    ],
    orange: [
      "rgba(255, 152, 0, 0.7)",
      "rgba(251, 140, 0, 0.7)",
      "rgba(245, 124, 0, 0.7)",
      "rgba(239, 108, 0, 0.7)",
      "rgba(230, 81, 0, 0.7)",
    ],
  }

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

      // Selecionar o esquema de cores
      const selectedColors = colorSchemes[colorScheme]

      // Gerar cores adicionais se necessário
      const backgroundColors = labels.map((_, i) => selectedColors[i % selectedColors.length])

      // Criar dataset para o gráfico
      const dataset = {
        label: title,
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) => color.replace("0.7", "1")),
        borderWidth: 1,
      }

      setChartData({
        labels,
        datasets: [dataset],
      })
    } catch (error) {
      console.error(`Error processing chart data for ${title}:`, error)
    }
  }, [data, groupByField, title, colorScheme])

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: width && width < 500 ? "bottom" : "right",
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: width && width < 400 ? 10 : 12,
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

          // Ajusta o tamanho mínimo para exibição com base no tamanho do container
          const minPercentage = width && width < 400 ? 8 : 5

          return percentage > minPercentage ? `${percentage}%` : ""
        },
        color: "#ffffff",
        font: {
          weight: "bold",
          size: width && width < 400 ? 10 : 12,
        },
        textStrokeColor: "#000000",
        textStrokeWidth: 1,
        textShadowBlur: 3,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        align: "center",
        anchor: "center",
      },
    },
    layout: {
      padding: width && width < 400 ? 5 : 10,
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

  return (
    <div ref={containerRef} className="w-full h-full">
      <Pie ref={chartRef} options={options} data={chartData} />
    </div>
  )
}
