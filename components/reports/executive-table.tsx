"use client"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Check, X } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { CompletedConsultingProject } from "@/lib/completed-consulting-service"

interface ExecutiveTableProps {
  projects: CompletedConsultingProject[]
  isLoading?: boolean
}

export function ExecutiveTable({ projects, isLoading = false }: ExecutiveTableProps) {
  // Formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }

  // Renderizar o tipo de projeto com badge
  const renderTipo = (tipo: string) => {
    if (tipo.toLowerCase() === "consultoria") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Consultoria
        </Badge>
      )
    } else if (tipo.toLowerCase() === "upsell") {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          Upsell
        </Badge>
      )
    }
    return tipo
  }

  // Renderizar status da bonificação
  const renderBonificacao = (bonificada: boolean) => {
    return bonificada ? (
      <Badge variant="outline" className="bg-green-50 text-green-700">
        <Check className="mr-1 h-3 w-3" /> SIM
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700">
        <X className="mr-1 h-3 w-3" /> NÃO
      </Badge>
    )
  }

  // Renderizar status da assinatura
  const renderAssinaturaStatus = (assinatura_fechamento: boolean) => {
    return assinatura_fechamento ? (
      <Badge variant="outline" className="bg-green-50 text-green-700">
        <Check className="mr-1 h-3 w-3" /> SIM
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700">
        <X className="mr-1 h-3 w-3" /> NÃO
      </Badge>
    )
  }

  // Renderizar avaliação com estrelas
  const renderAvaliacao = (avaliacao: number) => {
    return (
      <div className="flex items-center gap-1">
        <span className="font-medium">{avaliacao}</span>
        <div className="flex">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`text-xs ${i < avaliacao ? "text-yellow-500" : "text-gray-300"}`}>
              ★
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Carregando dados...</p>
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma consultoria encontrada para o período selecionado.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Porte</TableHead>
            <TableHead>Consultor</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Conclusão</TableHead>
            <TableHead>Dias Totais</TableHead>
            <TableHead>Dias Efetivos</TableHead>
            <TableHead>Valor (R$)</TableHead>
            <TableHead>Avaliação</TableHead>
            <TableHead>Bonificada</TableHead>
            <TableHead>Assinatura</TableHead>
            <TableHead>Comissão (R$)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.cliente}</TableCell>
              <TableCell>{renderTipo(project.tipo)}</TableCell>
              <TableCell>{project.porte}</TableCell>
              <TableCell>{project.consultor || "Não atribuído"}</TableCell>
              <TableCell>{formatDate(project.data_inicio)}</TableCell>
              <TableCell>{formatDate(project.data_conclusao)}</TableCell>
              <TableCell>{project.tempo_dias}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{project.dias_efetivos}</span>
                  {project.dias_pausados > 0 && (
                    <span className="text-xs text-orange-600">(-{project.dias_pausados} pausados)</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatCurrency(project.valor_consultoria)}</TableCell>
              <TableCell>{renderAvaliacao(project.avaliacao)}</TableCell>
              <TableCell>{renderBonificacao(project.bonificada)}</TableCell>
              <TableCell>{renderAssinaturaStatus(project.assinatura_fechamento || false)}</TableCell>
              <TableCell>{formatCurrency(project.valor_comissao)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
