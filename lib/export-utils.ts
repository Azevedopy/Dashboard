import FileSaver from "file-saver"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { ConsultingProject, ConsultingStats } from "@/lib/types"

export function exportToCSV(data: any[], fileName: string): { success: boolean; message: string } {
  try {
    if (!data || data.length === 0) {
      return { success: false, message: "Nenhum dado para exportar." }
    }

    // Convert data to CSV
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)

    // Create blob and save
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    FileSaver.saveAs(blob, `${fileName}.csv`)

    return { success: true, message: "Dados exportados com sucesso!" }
  } catch (error) {
    console.error("Erro ao exportar para CSV:", error)
    return { success: false, message: "Erro ao exportar dados." }
  }
}

export function exportToExcel(data: any[], filename: string): { success: boolean; message: string } {
  try {
    if (!data || data.length === 0) {
      return { success: false, message: "Não há dados para exportar" }
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados")

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    // Save file
    FileSaver.saveAs(blob, `${filename}_${format(new Date(), "yyyy-MM-dd")}.xlsx`)

    return { success: true, message: "Arquivo Excel exportado com sucesso!" }
  } catch (error) {
    console.error("Erro ao exportar para Excel:", error)
    return { success: false, message: "Erro ao exportar arquivo Excel" }
  }
}

export function exportToPDF(data: any[], filename: string, title: string): void {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    // Header
    doc.setFillColor(0, 86, 214)
    doc.rect(0, 0, pageWidth, 30, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(title, 20, 20)

    // Reset text color
    doc.setTextColor(51, 51, 51)

    // Convert data to table format
    if (data.length > 0) {
      const headers = Object.keys(data[0])
      const rows = data.map((item) => headers.map((header) => item[header]?.toString() || ""))

      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: rows,
        theme: "grid",
        headStyles: {
          fillColor: [0, 86, 214],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
      })
    }

    // Save
    doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    throw error
  }
}

export function exportCompletedConsultingReportToPDF(projects: ConsultingProject[], stats: ConsultingStats): void {
  try {
    // Create new PDF document in landscape mode for better table fit
    const doc = new jsPDF("landscape")
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height

    // Colors
    const primaryColor = [0, 86, 214] as [number, number, number] // #0056D6
    const textColor = [51, 51, 51] as [number, number, number]
    const lightGray = [245, 245, 245] as [number, number, number]

    // Header
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 40, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("Relatório Completo de Consultorias Concluídas", 20, 25)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 35)

    // Reset text color
    doc.setTextColor(...textColor)

    let yPosition = 55

    // Calcular todos os totais
    const totalValorConsultoria = projects.reduce((sum, project) => sum + (project.valor_consultoria || 0), 0)
    const totalBonus = projects.reduce((sum, project) => sum + (project.valor_bonus || 0), 0)
    const totalImposto16 = projects.reduce((sum, project) => {
      const valorConsultoria = project.valor_consultoria || 0
      return sum + valorConsultoria * 0.16
    }, 0)
    const totalValorLiquido = totalValorConsultoria - totalImposto16
    const projetosBonificados = projects.filter((p) => p.bonificada).length
    const projetosPagos = projects.filter((p) => p.status === "pago" || p.data_fechamento).length
    const totalEstimativa = totalValorConsultoria + totalBonus
    const totalPago =
      projetosPagos > 0
        ? projects
            .filter((p) => p.status === "pago" || p.data_fechamento)
            .reduce((sum, p) => sum + (p.valor_consultoria || 0), 0)
        : 0
    const pendenteReceber = totalEstimativa - totalPago

    // Título do Resumo Financeiro - Centralizado
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    const titleWidth = doc.getTextWidth("Resumo Financeiro Completo")
    const titleX = (pageWidth - titleWidth) / 2
    doc.text("Resumo Financeiro Completo", titleX, yPosition)
    yPosition += 12

    // Dados do resumo financeiro unificados em ordem lógica
    const resumoFinanceiro = [
      ["Total de Projetos", projects.length.toString()],
      [
        "Projetos Bonificados",
        `${projetosBonificados} (${((projetosBonificados / projects.length) * 100).toFixed(1)}%)`,
      ],
      ["Projetos Pagos", `${projetosPagos} (${((projetosPagos / projects.length) * 100).toFixed(1)}%)`],
      ["Total Valor Consultoria", `R$ ${totalValorConsultoria.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total Bônus", `R$ ${totalBonus.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total Imposto 16%", `R$ ${totalImposto16.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total Valor Líquido", `R$ ${totalValorLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total Estimativa", `R$ ${totalEstimativa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Total Pago", `R$ ${totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      ["Pendente Receber", `R$ ${pendenteReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
    ]

    // Tabela única com formatação elegante e espaçamento reduzido
    autoTable(doc, {
      startY: yPosition,
      head: [["Descrição", "Valor"]],
      body: resumoFinanceiro,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
        halign: "center",
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: {
          cellWidth: 110,
          fontStyle: "bold",
          halign: "left",
          fillColor: lightGray,
        },
        1: {
          cellWidth: 110,
          halign: "right",
          fontStyle: "bold",
          textColor: primaryColor,
        },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      // Destacar linhas importantes
      didParseCell: (data) => {
        // Destacar totais principais
        if (data.row.index >= 0) {
          const rowText = resumoFinanceiro[data.row.index][0]
          if (
            rowText.includes("Total Estimativa") ||
            rowText.includes("Total Pago") ||
            rowText.includes("Pendente Receber")
          ) {
            data.cell.styles.fillColor = [230, 240, 255]
            data.cell.styles.fontStyle = "bold"
            data.cell.styles.fontSize = 11
          }
        }
      },
      margin: { left: (pageWidth - 220) / 2 },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 15

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 30
    }

    // Detalhamento Completo dos Projetos - Título centralizado
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    const detailTitleWidth = doc.getTextWidth("Detalhamento Completo dos Projetos")
    const detailTitleX = (pageWidth - detailTitleWidth) / 2
    doc.text("Detalhamento Completo dos Projetos", detailTitleX, yPosition)
    yPosition += 15

    // Preparar dados da tabela com TODAS as informações solicitadas
    const projectsData = projects.map((project) => {
      const valorConsultoria = project.valor_consultoria || 0
      const valorBonus = project.valor_bonus || 0
      const imposto16 = valorConsultoria * 0.16
      const valorLiquidoMenosImposto = valorConsultoria - imposto16
      const recebeBonificacao = project.bonificada ? "Sim" : "Não"
      const pagoCliente = project.status === "pago" || project.data_fechamento ? "Sim" : "Não"
      const mesBonus =
        project.bonificada && project.data_finalizacao
          ? format(new Date(project.data_finalizacao), "MM/yyyy", { locale: ptBR })
          : "N/A"
      const totalEstimativaProjeto = valorConsultoria + valorBonus
      const totalPagoProjeto = pagoCliente === "Sim" ? valorConsultoria : 0

      return [
        project.cliente || "N/A", // Cliente
        project.tipo || "N/A", // Tipo
        project.data_inicio ? format(new Date(project.data_inicio), "dd/MM/yy") : "N/A", // Data Início
        project.data_termino ? format(new Date(project.data_termino), "dd/MM/yy") : "N/A", // Data Término
        project.tempo_dias?.toString() || "N/A", // Tempo em Dias
        project.porte || "N/A", // Porte
        project.avaliacao_estrelas ? project.avaliacao_estrelas.toString() : "N/A", // Avaliação (apenas número)
        project.assinatura_fechamento ? "SIM" : "NÃO", // Assinatura
        `R$ ${valorConsultoria.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, // Valor Consultoria
        `R$ ${valorBonus.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, // Bônus
        `R$ ${valorLiquidoMenosImposto.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, // Valor Líquido (menos 16%)
        recebeBonificacao, // Recebe Bonificação
        pagoCliente, // Pago pelo Cliente
        mesBonus, // Mês Bonificação
        `R$ ${totalEstimativaProjeto.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, // Total Estimativa
        `R$ ${totalPagoProjeto.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, // Total Pago
      ]
    })

    // Headers da tabela
    const headers = [
      "Cliente",
      "Tipo",
      "Dt Início",
      "Dt Término",
      "Dias",
      "Porte",
      "Aval.",
      "Assin.",
      "Vlr Consult.",
      "Bônus",
      "Vlr Líq. 16%",
      "Rec. Bonus",
      "Pago",
      "Mês Bonus",
      "Tot. Estim.",
      "Tot. Pago",
    ]

    // Calcular largura total da tabela para centralização
    const totalTableWidth = 18 + 12 + 12 + 12 + 8 + 12 + 10 + 12 + 16 + 14 + 16 + 12 + 10 + 12 + 16 + 16 // 198px
    const tableMarginLeft = (pageWidth - totalTableWidth) / 2

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
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 18 }, // Cliente
        1: { cellWidth: 12 }, // Tipo
        2: { cellWidth: 12 }, // Data Início
        3: { cellWidth: 12 }, // Data Término
        4: { cellWidth: 8, halign: "center" }, // Dias
        5: { cellWidth: 12 }, // Porte
        6: { cellWidth: 10, halign: "center" }, // Avaliação
        7: { cellWidth: 12, halign: "center" }, // Assinatura
        8: { cellWidth: 16, halign: "right" }, // Valor Consultoria
        9: { cellWidth: 14, halign: "right" }, // Bônus
        10: { cellWidth: 16, halign: "right" }, // Valor Líquido 16%
        11: { cellWidth: 12, halign: "center" }, // Recebe Bonificação
        12: { cellWidth: 10, halign: "center" }, // Pago
        13: { cellWidth: 12, halign: "center" }, // Mês Bonus
        14: { cellWidth: 16, halign: "right" }, // Total Estimativa
        15: { cellWidth: 16, halign: "right" }, // Total Pago
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { left: tableMarginLeft }, // Centralizar tabela
    })

    yPosition = (doc as any).lastAutoTable.finalY + 15

    // Check if we need a new page for totals
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 30
    }

    // Linha de Totais Completos
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    const totalsTitle = "TOTAIS GERAIS"
    const totalsTitleWidth = doc.getTextWidth(totalsTitle)
    const totalsTitleX = (pageWidth - totalsTitleWidth) / 2
    doc.text(totalsTitle, totalsTitleX, yPosition)
    yPosition += 15

    const totalsData = [
      [
        "TOTAL",
        "",
        "",
        "",
        projects.reduce((sum, p) => sum + (p.tempo_dias || 0), 0).toString(),
        "",
        "",
        "",
        `R$ ${totalValorConsultoria.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
        `R$ ${totalBonus.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
        `R$ ${totalValorLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
        `${projetosBonificados}/${projects.length}`,
        `${projetosPagos}/${projects.length}`,
        "",
        `R$ ${totalEstimativa.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
        `R$ ${totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
      ],
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: totalsData,
      theme: "grid",
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 12 },
        2: { cellWidth: 12 },
        3: { cellWidth: 12 },
        4: { cellWidth: 8, halign: "center" },
        5: { cellWidth: 12 },
        6: { cellWidth: 10 },
        7: { cellWidth: 12 },
        8: { cellWidth: 16, halign: "right" },
        9: { cellWidth: 14, halign: "right" },
        10: { cellWidth: 16, halign: "right" },
        11: { cellWidth: 12, halign: "center" },
        12: { cellWidth: 10, halign: "center" },
        13: { cellWidth: 12 },
        14: { cellWidth: 16, halign: "right" },
        15: { cellWidth: 16, halign: "right" },
      },
      margin: { left: tableMarginLeft }, // Mesma centralização da tabela principal
    })

    // Análise por Status de Pagamento
    yPosition = (doc as any).lastAutoTable.finalY + 20

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 30
    }

    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Análise por Status de Pagamento", 20, yPosition)
    yPosition += 12

    const statusPagamento = [
      ["Projetos Pagos", projetosPagos.toString(), `R$ ${totalPago.toLocaleString("pt-BR")}`],
      [
        "Projetos Pendentes",
        (projects.length - projetosPagos).toString(),
        `R$ ${(totalValorConsultoria - totalPago).toLocaleString("pt-BR")}`,
      ],
      ["Taxa de Pagamento", `${((projetosPagos / projects.length) * 100).toFixed(1)}%`, ""],
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [["Status", "Quantidade", "Valor"]],
      body: statusPagamento,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: "center", cellWidth: 40 },
        2: { halign: "right", cellWidth: 60 },
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    })

    // Análise por Bonificação
    yPosition = (doc as any).lastAutoTable.finalY + 15

    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Análise por Bonificação", 20, yPosition)
    yPosition += 12

    const statusBonificacao = [
      ["Projetos Bonificados", projetosBonificados.toString(), `R$ ${totalBonus.toLocaleString("pt-BR")}`],
      ["Projetos Regulares", (projects.length - projetosBonificados).toString(), "R$ 0"],
      ["Taxa de Bonificação", `${((projetosBonificados / projects.length) * 100).toFixed(1)}%`, ""],
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [["Status", "Quantidade", "Valor Bônus"]],
      body: statusBonificacao,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: "center", cellWidth: 40 },
        2: { halign: "right", cellWidth: 60 },
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
      doc.text("Vercel Support Dashboard - Relatório Completo de Consultorias", 20, pageHeight - 10)
    }

    // Save the PDF
    const fileName = `relatorio_completo_consultorias_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`
    doc.save(fileName)
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    throw error
  }
}

export function exportCompletedConsultingReport(projects: ConsultingProject[], stats: ConsultingStats): void {
  try {
    if (!projects || projects.length === 0) {
      throw new Error("Nenhum dado para exportar")
    }

    const workbook = XLSX.utils.book_new()

    // 1. ABA: Dados Completos
    const completeData = projects.map((project) => {
      const valorConsultoria = project.valor_consultoria || 0
      const valorBonus = project.valor_bonus || 0
      const imposto16 = valorConsultoria * 0.16
      const valorLiquidoMenosImposto = valorConsultoria - imposto16
      const recebeBonificacao = project.bonificada ? "Sim" : "Não"
      const pagoCliente = project.status === "pago" || project.data_fechamento ? "Sim" : "Não"
      const mesBonus =
        project.bonificada && project.data_finalizacao
          ? format(new Date(project.data_finalizacao), "MM/yyyy", { locale: ptBR })
          : "N/A"
      const totalEstimativa = valorConsultoria + valorBonus
      const totalPago = pagoCliente === "Sim" ? valorConsultoria : 0

      return {
        Cliente: project.cliente || "N/A",
        Tipo: project.tipo || "N/A",
        "Data de Início": project.data_inicio || "N/A",
        "Data de Término": project.data_termino || "N/A",
        "Tempo em Dias": project.tempo_dias || 0,
        Porte: project.porte || "N/A",
        Avaliação: project.avaliacao_estrelas || "N/A",
        "Assinatura do Fechamento": project.assinatura_fechamento ? "SIM" : "NÃO",
        "Valor da Consultoria": valorConsultoria,
        Bônus: valorBonus,
        "Valor Líquido (menos imposto 16%)": valorLiquidoMenosImposto,
        "Recebe Bonificação": recebeBonificacao,
        "Pago pelo Cliente": pagoCliente,
        "Mês da Bonificação": mesBonus,
        "Total Estimativa": totalEstimativa,
        "Total Pago": totalPago,
        Consultor: project.consultor || "Não atribuído",
        Status: project.status || "N/A",
        "Prazo Atingido": project.prazo_atingido ? "Sim" : "Não",
      }
    })

    const completeDataSheet = XLSX.utils.json_to_sheet(completeData)
    XLSX.utils.book_append_sheet(workbook, completeDataSheet, "Dados Completos")

    // 2. ABA: Resumo Financeiro
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

    const resumoFinanceiro = [
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

    const resumoSheet = XLSX.utils.json_to_sheet(resumoFinanceiro)
    XLSX.utils.book_append_sheet(workbook, resumoSheet, "Resumo Financeiro")

    // 3. ABA: Análise por Status
    const analiseStatus = [
      {
        Status: "Projetos Pagos",
        Quantidade: projetosPagos,
        Percentual: `${((projetosPagos / projects.length) * 100).toFixed(1)}%`,
        "Valor Total": `R$ ${totalPago.toLocaleString("pt-BR")}`,
      },
      {
        Status: "Projetos Pendentes",
        Quantidade: projects.length - projetosPagos,
        Percentual: `${(((projects.length - projetosPagos) / projects.length) * 100).toFixed(1)}%`,
        "Valor Total": `R$ ${(totalValorConsultoria - totalPago).toLocaleString("pt-BR")}`,
      },
      {
        Status: "Projetos Bonificados",
        Quantidade: projetosBonificados,
        Percentual: `${((projetosBonificados / projects.length) * 100).toFixed(1)}%`,
        "Valor Total": `R$ ${totalBonus.toLocaleString("pt-BR")}`,
      },
    ]

    const statusSheet = XLSX.utils.json_to_sheet(analiseStatus)
    XLSX.utils.book_append_sheet(workbook, statusSheet, "Análise por Status")

    // Gerar e baixar o arquivo
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    })

    const fileName = `relatorio_completo_consultorias_${new Date().toISOString().split("T")[0]}.xlsx`
    FileSaver.saveAs(blob, fileName)
  } catch (error) {
    console.error("Erro ao exportar relatório completo:", error)
    throw error
  }
}
