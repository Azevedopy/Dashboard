import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { CompletedConsultingProject } from "./completed-consulting-service"
import { formatCurrency } from "./utils"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export function exportExecutiveReportToPDF(
  projects: CompletedConsultingProject[],
  startDate: string,
  endDate: string,
  selectedConsultor?: string,
  selectedTipo?: string,
) {
  const doc = new jsPDF("landscape")

  // Título
  doc.setFontSize(16)
  doc.text("Relatório Executivo - Consultorias Concluídas", 14, 15)

  // Período
  doc.setFontSize(12)
  const periodo = `Período: ${format(new Date(startDate), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(endDate), "dd/MM/yyyy", { locale: ptBR })}`
  doc.text(periodo, 14, 25)

  // Filtros aplicados
  let filtros = "Filtros: "
  if (selectedConsultor && selectedConsultor !== "todos") {
    filtros += `Consultor: ${selectedConsultor} | `
  }
  if (selectedTipo && selectedTipo !== "todos") {
    filtros += `Tipo: ${selectedTipo} | `
  }
  if (filtros === "Filtros: ") {
    filtros += "Nenhum"
  } else {
    filtros = filtros.slice(0, -3) // Remove último " | "
  }
  doc.text(filtros, 14, 32)

  // Resumo
  const totalProjetos = projects.length
  const totalFaturamento = projects.reduce((sum, p) => sum + p.valor_consultoria, 0)
  const totalComissoes = projects.reduce((sum, p) => sum + p.valor_comissao, 0)
  const projetosBonificados = projects.filter((p) => p.bonificada).length
  const projetosAssinados = projects.filter((p) => p.assinatura_fechamento).length

  doc.setFontSize(10)
  doc.text(`Total de Projetos: ${totalProjetos}`, 14, 42)
  doc.text(`Faturamento Total: ${formatCurrency(totalFaturamento)}`, 14, 48)
  doc.text(`Total de Comissões: ${formatCurrency(totalComissoes)}`, 14, 54)
  doc.text(
    `Projetos Bonificados: ${projetosBonificados} (${((projetosBonificados / totalProjetos) * 100).toFixed(1)}%)`,
    150,
    42,
  )
  doc.text(
    `Projetos com Assinatura: ${projetosAssinados} (${((projetosAssinados / totalProjetos) * 100).toFixed(1)}%)`,
    150,
    48,
  )

  // Tabela
  const tableData = projects.map((project) => [
    project.cliente,
    project.tipo,
    project.porte,
    project.consultor || "N/A",
    format(new Date(project.data_inicio), "dd/MM/yyyy", { locale: ptBR }),
    format(new Date(project.data_conclusao), "dd/MM/yyyy", { locale: ptBR }),
    project.tempo_dias.toString(),
    project.dias_efetivos.toString(),
    formatCurrency(project.valor_consultoria),
    `${project.avaliacao} ⭐`,
    project.bonificada ? "SIM" : "NÃO",
    project.assinatura_fechamento ? "SIM" : "NÃO",
    formatCurrency(project.valor_comissao),
  ])

  doc.autoTable({
    head: [
      [
        "Cliente",
        "Tipo",
        "Porte",
        "Consultor",
        "Início",
        "Conclusão",
        "Dias Tot.",
        "Dias Efet.",
        "Valor",
        "Aval.",
        "Bonif.",
        "Assin.",
        "Comissão",
      ],
    ],
    body: tableData,
    startY: 65,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      8: { halign: "right" }, // Valor
      12: { halign: "right" }, // Comissão
    },
  })

  // Salvar
  const fileName = `relatorio-executivo-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`
  doc.save(fileName)
}

export function exportExecutiveReportToExcel(
  projects: CompletedConsultingProject[],
  startDate: string,
  endDate: string,
  selectedConsultor?: string,
  selectedTipo?: string,
) {
  // Dados da planilha
  const data = projects.map((project) => ({
    Cliente: project.cliente,
    Tipo: project.tipo,
    Porte: project.porte,
    Consultor: project.consultor || "N/A",
    "Data Início": format(new Date(project.data_inicio), "dd/MM/yyyy", { locale: ptBR }),
    "Data Conclusão": format(new Date(project.data_conclusao), "dd/MM/yyyy", { locale: ptBR }),
    "Dias Totais": project.tempo_dias,
    "Dias Efetivos": project.dias_efetivos,
    "Dias Pausados": project.dias_pausados || 0,
    "Valor Consultoria": project.valor_consultoria,
    Avaliação: project.avaliacao,
    Bonificada: project.bonificada ? "SIM" : "NÃO",
    "Assinatura Fechamento": project.assinatura_fechamento ? "SIM" : "NÃO",
    "Valor Comissão": project.valor_comissao,
  }))

  // Resumo
  const totalProjetos = projects.length
  const totalFaturamento = projects.reduce((sum, p) => sum + p.valor_consultoria, 0)
  const totalComissoes = projects.reduce((sum, p) => sum + p.valor_comissao, 0)
  const projetosBonificados = projects.filter((p) => p.bonificada).length
  const projetosAssinados = projects.filter((p) => p.assinatura_fechamento).length

  const resumo = [
    { Métrica: "Total de Projetos", Valor: totalProjetos },
    { Métrica: "Faturamento Total", Valor: totalFaturamento },
    { Métrica: "Total de Comissões", Valor: totalComissoes },
    {
      Métrica: "Projetos Bonificados",
      Valor: `${projetosBonificados} (${((projetosBonificados / totalProjetos) * 100).toFixed(1)}%)`,
    },
    {
      Métrica: "Projetos com Assinatura",
      Valor: `${projetosAssinados} (${((projetosAssinados / totalProjetos) * 100).toFixed(1)}%)`,
    },
    {
      Métrica: "Período",
      Valor: `${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`,
    },
  ]

  // Criar workbook
  const wb = XLSX.utils.book_new()

  // Aba de dados detalhados
  const ws1 = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws1, "Consultorias Detalhadas")

  // Aba de resumo
  const ws2 = XLSX.utils.json_to_sheet(resumo)
  XLSX.utils.book_append_sheet(wb, ws2, "Resumo Executivo")

  // Salvar
  const fileName = `relatorio-executivo-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`
  XLSX.writeFile(wb, fileName)
}
