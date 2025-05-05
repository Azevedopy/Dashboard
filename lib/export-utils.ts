import * as FileSaver from "file-saver"
import * as XLSX from "xlsx"

export function exportToCSV(data: any[], fileName: string): { success: boolean; message: string } {
  try {
    if (!data || data.length === 0) {
      return { success: false, message: "Nenhum dado para exportar." }
    }

    const csvRows = []

    // Cabeçalho
    const headers = Object.keys(data[0])
    csvRows.push(headers.join(","))

    // Linhas
    for (const row of data) {
      const values = headers.map((header) => {
        let value = row[header]
        if (typeof value === "string") {
          value = value.replace(/"/g, '""') // Escape double quotes
          return `"${value}"` // Quote the value
        }
        return value
      })
      csvRows.push(values.join(","))
    }

    const csvString = csvRows.join("\r\n")

    // Blob e download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" })
    FileSaver.saveAs(blob, `${fileName}.csv`)

    return { success: true, message: "Dados exportados com sucesso!" }
  } catch (error) {
    console.error("Erro ao exportar para CSV:", error)
    return { success: false, message: "Erro ao exportar dados." }
  }
}

export function exportToExcel(data: any[], fileName: string): { success: boolean; message: string } {
  try {
    if (!data || data.length === 0) {
      return { success: false, message: "Nenhum dado para exportar." }
    }

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([new Uint8Array(excelBuffer)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    })
    FileSaver.saveAs(blob, `${fileName}.xlsx`)

    return { success: true, message: "Dados exportados com sucesso para Excel!" }
  } catch (error) {
    console.error("Erro ao exportar para Excel:", error)
    return { success: false, message: "Erro ao exportar dados para Excel." }
  }
}
