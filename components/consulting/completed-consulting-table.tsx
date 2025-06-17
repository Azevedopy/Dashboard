"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { ConsultingProject } from "@/lib/types"

interface CompletedConsultingTableProps {
  projects: ConsultingProject[]
  isLoading: boolean
}

export function CompletedConsultingTable({ projects, isLoading }: CompletedConsultingTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Verificar se estamos em ambiente de preview
  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("v0.dev")

  // Garantir que projects é sempre um array
  const safeProjects = Array.isArray(projects) ? projects : []

  const filteredProjects = safeProjects.filter(
    (project) =>
      project.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.consultor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.porte?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }

  // Renderizar estrelas para avaliação
  const renderStars = (rating?: number) => {
    if (!rating) return "N/A"
    return `${rating}/5 ⭐`
  }

  // Renderizar o tipo de projeto com badge
  const renderTipo = (tipo: string) => {
    if (!tipo) return "N/A"

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

  // Função para lidar com o clique no botão Ver
  const handleViewClick = (id: string) => {
    if (isPreview) {
      alert("Funcionalidade indisponível no modo preview")
    } else {
      window.location.href = `/consultoria/projetos/${id}`
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar por cliente, consultor, tipo ou porte..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="text-sm text-muted-foreground">
          {filteredProjects.length} {filteredProjects.length === 1 ? "projeto" : "projetos"}
          {isPreview && " (Preview)"}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Porte</TableHead>
              <TableHead>Consultor</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Duração (dias)</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Avaliação</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead>Data Conclusão</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    {Array(11)
                      .fill(0)
                      .map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                  </TableRow>
                ))
            ) : filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  Nenhum projeto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.cliente}</TableCell>
                  <TableCell>{renderTipo(project.tipo)}</TableCell>
                  <TableCell>{project.porte}</TableCell>
                  <TableCell>{project.consultor || "Não atribuído"}</TableCell>
                  <TableCell>
                    {formatDate(project.data_inicio)} - {formatDate(project.data_termino)}
                  </TableCell>
                  <TableCell>{project.tempo_dias}</TableCell>
                  <TableCell>{formatCurrency(project.valor_consultoria)}</TableCell>
                  <TableCell>{renderStars(project.avaliacao_estrelas)}</TableCell>
                  <TableCell>
                    {project.valor_comissao
                      ? `${formatCurrency(project.valor_comissao)} (${project.percentual_comissao || 0}%)`
                      : "N/A"}
                  </TableCell>
                  <TableCell>{formatDate(project.data_finalizacao)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleViewClick(project.id)}>
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
