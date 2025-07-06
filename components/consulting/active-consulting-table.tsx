"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye, Check, X, CheckCircle, Edit, XCircle, Pause, Play } from "lucide-react"
import { StarIcon } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
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
  onFinalize: (id: string, avaliacao: number, assinaturaFechamento: boolean) => Promise<void>
  onCancel: (id: string) => Promise<void>
  onPause: (id: string) => Promise<void>
  onResume?: (id: string) => Promise<void>
}

export function ActiveConsultingTable({
  projects,
  isLoading,
  onFinalize,
  onCancel,
  onPause,
  onResume,
}: ActiveConsultingTableProps) {
  const [selectedProject, setSelectedProject] = useState<ConsultingProject | null>(null)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false)
  const [avaliacao, setAvaliacao] = useState<number>(5)
  const [assinaturaFechamento, setAssinaturaFechamento] = useState<boolean>(false)
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

  // Calcular dias efetivos (descontando dias pausados)
  const getDiasEfetivos = (project: ConsultingProject) => {
    const diasTotais = project.tempo_dias || 0
    const diasPausados = project.dias_pausados || 0
    return Math.max(0, diasTotais - diasPausados)
  }

  // Verificar se o prazo foi atingido (considerando apenas dias efetivos)
  const getPrazoStatus = (project: ConsultingProject) => {
    const diasEfetivos = getDiasEfetivos(project)
    const prazoAtingido = isPrazoAtingido(project.tipo, diasEfetivos)

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

  // Renderizar status da assinatura
  const renderAssinaturaStatus = (project: ConsultingProject) => {
    const assinado = project.assinatura_fechamento || false

    return assinado ? (
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

  // Renderizar status do projeto
  const renderStatus = (project: ConsultingProject) => {
    const isPaused = project.data_pausa !== null && project.data_pausa !== undefined

    if (isPaused) {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            <Pause className="mr-1 h-3 w-3" /> Pausado
          </Badge>
          <span className="text-xs text-muted-foreground">{project.dias_pausados || 0} dias pausados</span>
        </div>
      )
    }

    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700">
        Em Andamento
      </Badge>
    )
  }

  // Calcular comissão com base na avaliação atual (usando dias efetivos)
  const calculateCurrentCommission = () => {
    if (!selectedProject) return { percentual: 0, valor: 0 }

    const diasEfetivos = getDiasEfetivos(selectedProject)
    const prazoAtingido = isPrazoAtingido(selectedProject.tipo, diasEfetivos)
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
    setAssinaturaFechamento(false) // Reset checkbox
    setIsFinalizeOpen(true)
  }

  const handlePause = async (id: string) => {
    try {
      await onPause(id)
    } catch (error) {
      console.error("Error pausing project:", error)
    }
  }

  const handleResume = async (id: string) => {
    try {
      if (onResume) {
        await onResume(id)
      }
    } catch (error) {
      console.error("Error resuming project:", error)
    }
  }

  const confirmFinalize = async () => {
    if (selectedProject) {
      await onFinalize(selectedProject.id, avaliacao, assinaturaFechamento)
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

  const onEdit = (id: string) => {
    router.push(`/consultoria/projetos/editar/${id}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array(12)
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
                    {Array(12)
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
              <TableHead>Dias Totais</TableHead>
              <TableHead>Dias Efetivos</TableHead>
              <TableHead>Valor (R$)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prazo Atingido</TableHead>
              <TableHead>Assinatura</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const isPaused = project.data_pausa !== null && project.data_pausa !== undefined
              const diasEfetivos = getDiasEfetivos(project)

              return (
                <TableRow key={project.id} className={isPaused ? "bg-orange-50/30" : ""}>
                  <TableCell className="font-medium">{project.cliente}</TableCell>
                  <TableCell>{renderTipo(project.tipo)}</TableCell>
                  <TableCell>{project.porte}</TableCell>
                  <TableCell>{project.consultor || "Não atribuído"}</TableCell>
                  <TableCell>
                    {formatDate(project.data_inicio)} - {formatDate(project.data_termino)}
                  </TableCell>
                  <TableCell>{project.tempo_dias}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{diasEfetivos}</span>
                      {project.dias_pausados > 0 && (
                        <span className="text-xs text-orange-600">(-{project.dias_pausados} pausados)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(project.valor_consultoria)}</TableCell>
                  <TableCell>{renderStatus(project)}</TableCell>
                  <TableCell>{getPrazoStatus(project)}</TableCell>
                  <TableCell>{renderAssinaturaStatus(project)}</TableCell>
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
                        <DropdownMenuItem onClick={() => onEdit(project.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        {isPaused ? (
                          <DropdownMenuItem onClick={() => handleResume(project.id)} className="text-green-600">
                            <Play className="mr-2 h-4 w-4" />
                            <span>Retomar</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handlePause(project.id)} className="text-orange-600">
                            <Pause className="mr-2 h-4 w-4" />
                            <span>Pausar</span>
                          </DropdownMenuItem>
                        )}
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
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Finalização e Avaliação */}
      <Dialog open={isFinalizeOpen} onOpenChange={setIsFinalizeOpen}>
        <DialogContent className="sm:max-w-2xl bg-zinc-900 text-white border-zinc-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Finalizar Consultoria</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Avalie a consultoria para o cliente {selectedProject?.cliente} e calcule a comissão do consultor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Detalhes da Consultoria:</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-zinc-400">Cliente:</div>
                  <div className="text-white font-medium">{selectedProject?.cliente}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Tipo:</div>
                  <div className="text-white font-medium">{selectedProject?.tipo}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Consultor:</div>
                  <div className="text-white font-medium">{selectedProject?.consultor || "Não atribuído"}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Porte:</div>
                  <div className="text-white font-medium">{selectedProject?.porte}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Dias totais:</div>
                  <div className="text-white font-medium">{selectedProject?.tempo_dias || 0}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Dias pausados:</div>
                  <div className="text-white font-medium">{selectedProject?.dias_pausados || 0}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Dias efetivos:</div>
                  <div className="text-white font-medium">{selectedProject ? getDiasEfetivos(selectedProject) : 0}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Prazo atingido:</div>
                  <div className="text-white font-medium">
                    {selectedProject && isPrazoAtingido(selectedProject.tipo, getDiasEfetivos(selectedProject))
                      ? "Sim"
                      : "Não"}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-400">Valor da consultoria:</div>
                  <div className="text-white font-medium">
                    {formatCurrency(selectedProject?.valor_consultoria || 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-400">Avaliação da Consultoria:</h3>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setAvaliacao(star)} className="focus:outline-none">
                    <StarIcon
                      className={`h-10 w-10 ${star <= avaliacao ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"}`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center text-sm text-zinc-400">
                Avaliação: {avaliacao} {avaliacao === 1 ? "estrela" : "estrelas"}
              </div>
            </div>

            {/* Checkbox para Assinatura do Fechamento */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="assinatura-fechamento"
                  checked={assinaturaFechamento}
                  onCheckedChange={(checked) => setAssinaturaFechamento(checked as boolean)}
                  className="border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label htmlFor="assinatura-fechamento" className="text-sm font-medium text-zinc-300 cursor-pointer">
                  Assinatura do fechamento confirmada
                </label>
              </div>
              <p className="text-xs text-zinc-500 ml-8">
                Confirme que o cliente assinou o documento de fechamento da consultoria
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                Cálculo da Comissão (baseado em dias efetivos):
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-800 p-4 rounded-lg">
                <div>
                  <div className="text-zinc-400">Valor da consultoria:</div>
                  <div className="text-white font-medium text-lg">
                    {formatCurrency(selectedProject?.valor_consultoria || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-400">Percentual de comissão:</div>
                  <div className="text-white font-medium text-lg">{calculateCurrentCommission().percentual}%</div>
                </div>
                <div className="col-span-2 border-t border-zinc-700 pt-2 mt-2">
                  <div className="text-zinc-400">Valor da comissão:</div>
                  <div className="text-green-400 font-bold text-xl">
                    {formatCurrency(calculateCurrentCommission().valor)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsFinalizeOpen(false)}
              className="bg-transparent text-white border-zinc-700 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            {selectedProject?.data_pausa ? (
              <Button
                variant="outline"
                onClick={() => handleResume(selectedProject?.id || "")}
                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
              >
                <Play className="mr-2 h-4 w-4" />
                Retomar Consultoria
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handlePause(selectedProject?.id || "")}
                className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pausar Consultoria
              </Button>
            )}
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
