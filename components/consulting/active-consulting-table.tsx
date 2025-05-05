"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye, Check, X, CheckCircle, Edit, XCircle } from "lucide-react"
import { StarIcon } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"
import { calculateCommission, isPrazoAtingido } from "@/lib/commission-utils"
import type { ConsultingProject } from "@/lib/types"
import { useRouter } from "next/navigation"

interface ActiveConsultingTableProps {
  projects: ConsultingProject[]
  isLoading: boolean
  onFinalize: (id: string, avaliacao: number) => Promise<void>
  onCancel: (id: string) => Promise<void>
}

export function ActiveConsultingTable({ projects, isLoading, onFinalize, onCancel }: ActiveConsultingTableProps) {
  const [selectedProject, setSelectedProject] = useState<ConsultingProject | null>(null)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false)
  const [avaliacao, setAvaliacao] = useState<number>(5)
  const router = useRouter()

  // Formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }

  // Verificar se o prazo foi atingido
  const getPrazoStatus = (project: ConsultingProject) => {
    const prazoAtingido = isPrazoAtingido(project.tipo, project.tempo_dias)

    return prazoAtingido ? (
      <Badge variant="outline" className="bg-green-50 text-green-700">
        <Check className="mr-1 h-3 w-3" /> SIM
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700">
        <X className="mr-1 h-3 w-3" /> NÃO
      </Badge>
    )
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

  // Calcular comissão com base na avaliação atual
  const calculateCurrentCommission = () => {
    if (!selectedProject) return { percentual: 0, valor: 0 }

    const prazoAtingido = isPrazoAtingido(selectedProject.tipo, selectedProject.tempo_dias)
    const { percentual, valor } = calculateCommission(selectedProject.valor_consultoria, avaliacao, prazoAtingido)

    return { percentual, valor }
  }

  const handleCancel = (id: string) => {
    setSelectedProject(projects.find((project) => project.id === id) || null)
    setIsCancelOpen(true)
  }

  const handleFinalize = (project: ConsultingProject) => {
    setSelectedProject(project)
    setAvaliacao(5) // Reset para 5 estrelas por padrão
    setIsFinalizeOpen(true)
  }

  const confirmFinalize = async () => {
    if (selectedProject) {
      await onFinalize(selectedProject.id, avaliacao)
      setIsFinalizeOpen(false)
    }
  }

  const confirmCancel = async () => {
    if (selectedProject) {
      await onCancel(selectedProject.id)
      setIsCancelOpen(false)
    }
  }

  const onViewDetails = (id: string) => {
    router.push(`/consultoria/projetos/${id}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array(9)
                  .fill(0)
                  .map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-6 w-24" />
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    {Array(9)
                      .fill(0)
                      .map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (!projects || !projects.length) {
    return <div className="text-center py-4">Nenhuma consultoria em andamento encontrada.</div>
  }

  return (
    <>
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
              <TableHead>Valor (R$)</TableHead>
              <TableHead>Prazo Atingido</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
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
                <TableCell>{getPrazoStatus(project)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Ações
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(project.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>Detalhes</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/consultoria/projetos/editar/${project.id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFinalize(project)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>Finalizar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCancel(project.id)} className="text-red-600">
                        <XCircle className="mr-2 h-4 w-4" />
                        <span>Cancelar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Finalização e Avaliação */}
      <Dialog open={isFinalizeOpen} onOpenChange={setIsFinalizeOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl">Finalizar Consultoria</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Avalie a consultoria para o cliente {selectedProject?.cliente} e calcule a comissão do consultor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Detalhes da Consultoria:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-zinc-400">Cliente:</div>
                <div className="text-white">{selectedProject?.cliente}</div>

                <div className="text-zinc-400">Tipo:</div>
                <div className="text-white">{selectedProject?.tipo}</div>

                <div className="text-zinc-400">Consultor:</div>
                <div className="text-white">{selectedProject?.consultor || "Não atribuído"}</div>

                <div className="text-zinc-400">Porte:</div>
                <div className="text-white">{selectedProject?.porte}</div>

                <div className="text-zinc-400">Prazo atingido:</div>
                <div className="text-white">
                  {isPrazoAtingido(selectedProject?.tipo || "", selectedProject?.tempo_dias || 0) ? "Sim" : "Não"}
                </div>

                <div className="text-zinc-400">Valor da consultoria:</div>
                <div className="text-white">{formatCurrency(selectedProject?.valor_consultoria || 0)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-400">Avaliação da Consultoria:</h3>
              <div className="flex justify-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setAvaliacao(star)} className="focus:outline-none">
                    <StarIcon
                      className={`h-8 w-8 ${star <= avaliacao ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"}`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-zinc-400">
                Avaliação: {avaliacao} {avaliacao === 1 ? "estrela" : "estrelas"}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Cálculo da Comissão:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-zinc-400">Valor da consultoria:</div>
                <div className="text-white text-right">{formatCurrency(selectedProject?.valor_consultoria || 0)}</div>

                <div className="text-zinc-400">Percentual de comissão:</div>
                <div className="text-white text-right">{calculateCurrentCommission().percentual}%</div>

                <div className="text-zinc-400">Valor da comissão:</div>
                <div className="text-white text-right">{formatCurrency(calculateCurrentCommission().valor)}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsFinalizeOpen(false)}
              className="bg-transparent text-white border-zinc-700 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button onClick={confirmFinalize} className="bg-blue-600 hover:bg-blue-700 text-white">
              Finalizar Consultoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cancelamento */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Consultoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar a consultoria para {selectedProject?.cliente}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-red-600">Esta ação não pode ser desfeita. A consultoria será marcada como cancelada.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
