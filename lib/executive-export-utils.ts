import FileSaver from "file-saver"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ConsultingProject } from "@/lib/types"

export interface ExecutiveReportData {
  projects: ConsultingProject[]
  filters: {
    startDate?: string
    endDate?: string
    consultor?: string
    tipo?: string
  }
}

export function exportExecutiveReportToPDF(data: ExecutiveReportData): void {
  try {
    const { projects, filters } = data

    // Create new PDF document in landscape mode
    const doc = new jsPDF("landscape")
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height

    // Colors
    const primaryColor = [0, 86, 214] as [number, number, number] // #0056D6
    const textColor = [51, 51, 51] as [number, number, number]

    // Header
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 40, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("Relatório Executivo de Consultorias", 20, 25)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 35)

    // Reset text color
    doc.setTextColor(...textColor)

    let yPosition = 55

    // Filtros aplicados
    if (filters.startDate || filters.endDate || filters.consultor || filters.tipo) {
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Filtros Aplicados:", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      if (filters.startDate || filters.endDate) {
        const periodo = `Período: ${filters.startDate ? new Date(filters.startDate).toLocaleDateString("pt-BR") : "Início"} até ${filters.endDate ? new Date(filters.endDate).toLocaleDateString("pt-BR") : "Fim"}`
        doc.text(periodo, 20, yPosition)
        yPosition += 5
      }

      if (filters.consultor && filters.consultor !== "todos") {
        doc.text(`Consultor: ${filters.consultor}`, 20, yPosition)
        yPosition += 5
      }

      if (filters.tipo && filters.tipo !== "todos") {
        doc.text(`Tipo: ${filters.tipo}`, 20, yPosition)
        yPosition += 5
      }

      yPosition += 10
    }

    // Calcular totais
    const totalValorConsultoria = projects.reduce((sum, project) => sum + (project.valor_consultoria || 0), 0)
    const totalBonus = projects.reduce((sum, project) => sum + (project.valor_bonus || 0), 0)
    const totalImposto16 = totalValorConsultoria * 0.16
    const totalValorLiquido = totalValorConsultoria - totalImposto16
    const projetosBonificados = projects.filter((p) => p.bonificada).length
    const projetosPagos = projects.filter((p) => p.status === "pago" || p.data_fechamento).length
    const totalEstimativa = totalValorConsultoria + totalBonus
    const totalPago = projects
      .filter((p) => p.status === "pago" || p.data_fechamento)
      .reduce((sum, p) => sum + (p.valor_consultoria || 0), 0)

    // Resumo Executivo
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    const titleWidth = doc.getTextWidth("Resumo Executivo")
    const titleX = (pageWidth - titleWidth) / 2
    doc.text("Resumo Executivo", titleX, yPosition)
    yPosition += 15

    const resumoExecutivo = [
      ["Total de Projetos", projects.length.toString()],
      [
        "Projetos Bonificados",
        `${projetosBonificados} (${((projetosBonificados / projects.length) * 100).toFixed(1)}%)`,
      ],
      ["Projetos Pagos", `${projetosPagos} (${((projetosPagos / projects.length) * 100).toFixed(1)}%)`],
      ["Total Valor Consultoria", `R$ ${totalValorConsultoria.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total Bônus", `R$ ${totalBonus.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total Valor Líquido", `R$ ${totalValorLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total Estimativa", `R$ ${totalEstimativa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total Pago", `R$ ${totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [["Métrica", "Valor"]],
      body: resumoExecutivo,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: "bold" },
        1: { cellWidth: 80, halign: "right", fontStyle: "bold", textColor: primaryColor },
      },
      margin: { left: (pageWidth - 160) / 2 },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 20

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 30
    }

    // Detalhamento dos Projetos
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    const detailTitleWidth = doc.getTextWidth("Detalhamento dos Projetos")
    const detailTitleX = (pageWidth - detailTitleWidth) / 2
    doc.text("Detalhamento dos Projetos", detailTitleX, yPosition)
    yPosition += 15

    // Preparar dados da tabela
    const projectsData = projects.map((project) => {
      const valorConsultoria = project.valor_consultoria || 0
      const valorBonus = project.valor_bonus || 0
      const recebeBonificacao = project.bonificada ? "Sim" : "Não"
      const pagoCliente = project.status === "pago" || project.data_fechamento ? "Sim" : "Não"
      const totalEstimativaProjeto = valorConsultoria + valorBonus

      return [
        project.cliente || "N/A",
        project.tipo || "N/A",
        project.porte || "N/A",
        project.consultor || "N/A",
        project.data_inicio ? format(new Date(project.data_inicio), "dd/MM/yy") : "N/A",
        project.data_termino ? format(new Date(project.data_termino), "dd/MM/yy") : "N/A",
        `R$ ${valorConsultoria.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
        `R$ ${valorBonus.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
        recebeBonificacao,
        pagoCliente,
        `R$ ${totalEstimativaProjeto.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
      ]
    })

    const headers = [
      "Cliente",
      "Tipo",
      "Porte",
      "Consultor",
      "Dt Início",
      "Dt Término",
      "Vlr Consult.",
      "Bônus",
      "Rec. Bonus",
      "Pago",
      "Tot. Estim.",
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: projectsData,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Cliente
        1: { cellWidth: 15 }, // Tipo
        2: { cellWidth: 15 }, // Porte
        3: { cellWidth: 20 }, // Consultor
        4: { cellWidth: 15 }, // Data Início
        5: { cellWidth: 15 }, // Data Término
        6: { cellWidth: 20, halign: "right" }, // Valor Consultoria
        7: { cellWidth: 18, halign: "right" }, // Bônus
        8: { cellWidth: 15, halign: "center" }, // Recebe Bonificação
        9: { cellWidth: 12, halign: "center" }, // Pago
        10: { cellWidth: 20, halign: "right" }, // Total Estimativa
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    })

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10)
      doc.text("Vercel Support Dashboard - Relatório Executivo", 20, pageHeight - 10)
    }

    // Save the PDF
    const fileName = `relatorio_executivo_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`
    doc.save(fileName)
  } catch (error) {
    console.error("Erro ao gerar PDF executivo:", error)
    throw error
  }
}

export function exportExecutiveReportToExcel(data: ExecutiveReportData): void {
  try {
    const { projects, filters } = data

    if (!projects || projects.length === 0) {
      throw new Error("Nenhum dado para exportar")
    }

    const workbook = XLSX.utils.book_new()

    // Calcular totais
    const totalValorConsultoria = projects.reduce((sum, project) => sum + (project.valor_consultoria || 0), 0)
    const totalBonus = projects.reduce((sum, project) => sum + (project.valor_bonus || 0), 0)
    const totalImposto16 = totalValorConsultoria * 0.16
    const totalValorLiquido = totalValorConsultoria - totalImposto16
    const projetosBonificados = projects.filter((p) => p.bonificada).length
    const projetosPagos = projects.filter((p) => p.status === "pago" || p.data_fechamento).length
    const totalEstimativa = totalValorConsultoria + totalBonus
    const totalPago = projects
      .filter((p) => p.status === "pago" || p.data_fechamento)
      .reduce((sum, p) => sum + (p.valor_consultoria || 0), 0)

    // 1. ABA: Resumo Executivo
    const resumoExecutivo = [
      { Métrica: "Total de Projetos", Valor: projects.length },
      { Métrica: "Projetos Bonificados", Valor: projetosBonificados },
      { Métrica: "Projetos Pagos", Valor: projetosPagos },
      { Métrica: "Total Valor Consultoria", Valor: `R$ ${totalValorConsultoria.toLocaleString("pt-BR")}` },
      { Métrica: "Total Bônus", Valor: `R$ ${totalBonus.toLocaleString("pt-BR")}` },
      { Métrica: "Total Imposto 16%", Valor: `R$ ${totalImposto16.toLocaleString("pt-BR")}` },
      { Métrica: "Total Valor Líquido", Valor: `R$ ${totalValorLiquido.toLocaleString("pt-BR")}` },
      { Métrica: "Total Estimativa", Valor: `R$ ${totalEstimativa.toLocaleString("pt-BR")}` },
      { Métrica: "Total Pago", Valor: `R$ ${totalPago.toLocaleString("pt-BR")}` },
      { Métrica: "Taxa de Bonificação", Valor: `${((projetosBonificados / projects.length) * 100).toFixed(1)}%` },
      { Métrica: "Taxa de Pagamento", Valor: `${((projetosPagos / projects.length) * 100).toFixed(1)}%` },
    ]

    const resumoSheet = XLSX.utils.json_to_sheet(resumoExecutivo)
    XLSX.utils.book_append_sheet(workbook, resumoSheet, "Resumo Executivo")

    // 2. ABA: Detalhamento dos Projetos
    const detalhamentoProjetos = projects.map((project) => {
      const valorConsultoria = project.valor_consultoria || 0
      const valorBonus = project.valor_bonus || 0
      const imposto16 = valorConsultoria * 0.16
      const valorLiquidoMenosImposto = valorConsultoria - imposto16
      const recebeBonificacao = project.bonificada ? "Sim" : "Não"
      const pagoCliente = project.status === "pago" || project.data_fechamento ? "Sim" : "Não"
      const totalEstimativa = valorConsultoria + valorBonus
      const totalPago = pagoCliente === "Sim" ? valorConsultoria : 0

      return {
        Cliente: project.cliente || "N/A",
        Tipo: project.tipo || "N/A",
        Porte: project.porte || "N/A",
        Consultor: project.consultor || "Não atribuído",
        "Data de Início": project.data_inicio || "N/A",
        "Data de Término": project.data_termino || "N/A",
        "Valor da Consultoria": valorConsultoria,
        Bônus: valorBonus,
        "Valor Líquido (menos imposto 16%)": valorLiquidoMenosImposto,
        "Recebe Bonificação": recebeBonificacao,
        "Pago pelo Cliente": pagoCliente,
        "Total Estimativa": totalEstimativa,
        "Total Pago": totalPago,
        Status: project.status || "N/A",
        "Prazo Atingido": project.prazo_atingido ? "Sim" : "Não",
        Avaliação: project.avaliacao_estrelas || "N/A",
        "Assinatura do Fechamento": project.assinatura_fechamento ? "SIM" : "NÃO",
      }
    })

    const detalhamentoSheet = XLSX.utils.json_to_sheet(detalhamentoProjetos)
    XLSX.utils.book_append_sheet(workbook, detalhamentoSheet, "Detalhamento")

    // 3. ABA: Filtros Aplicados
    const filtrosAplicados = [
      { Filtro: "Período Início", Valor: filters.startDate || "Não aplicado" },
      { Filtro: "Período Fim", Valor: filters.endDate || "Não aplicado" },
      { Filtro: "Consultor", Valor: filters.consultor === "todos" ? "Todos" : filters.consultor || "Não aplicado" },
      { Filtro: "Tipo", Valor: filters.tipo === "todos" ? "Todos" : filters.tipo || "Não aplicado" },
      { Filtro: "Data de Geração", Valor: format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR }) },
    ]

    const filtrosSheet = XLSX.utils.json_to_sheet(filtrosAplicados)
    XLSX.utils.book_append_sheet(workbook, filtrosSheet, "Filtros")

    // Gerar e baixar o arquivo
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    })

    const fileName = `relatorio_executivo_${new Date().toISOString().split("T")[0]}.xlsx`
    FileSaver.saveAs(blob, fileName)
  } catch (error) {
    console.error("Erro ao exportar relatório executivo:", error)
    throw error
  }
}
