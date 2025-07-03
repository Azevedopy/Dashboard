"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, differenceInDays, parseISO } from "date-fns"
import { ArrowLeft, Save, Star } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/components/ui/use-toast"
import { createConsultingProject, getConsultores } from "@/lib/consulting-service"
import { formatCurrency } from "@/lib/utils"
import { calculateCommission, isPrazoAtingido } from "@/lib/commission-utils"

// Schema de validação
const consultingSchema = z.object({
  cliente: z.string().min(1, "Cliente é obrigatório"),
  tipo: z.enum(["consultoria", "upsell"], {
    required_error: "Tipo é obrigatório",
  }),
  porte: z.enum(["starter", "basic", "pro", "enterprise"], {
    required_error: "Porte é obrigatório",
  }),
  consultor: z.string().min(1, "Consultor é obrigatório"),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_termino: z.string().min(1, "Data de término é obrigatória"),
  valor_consultoria: z.number().min(0, "Valor deve ser positivo"),
  status: z.enum(["em_andamento", "concluido", "cancelado"]),
  avaliacao_estrelas: z.number().min(1).max(5).optional(),
  nota_consultoria: z.string().optional(),
})

type ConsultingFormData = z.infer<typeof consultingSchema>

export default function NovaConsultoriaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [consultores, setConsultores] = useState<string[]>([])
  const [avaliacao, setAvaliacao] = useState<number>(5)

  const [formData, setFormData] = useState<ConsultingFormData>({
    cliente: "",
    tipo: "consultoria",
    porte: "basic",
    consultor: "",
    data_inicio: "",
    data_termino: "",
    valor_consultoria: 0,
    status: "em_andamento",
  })

  // Buscar consultores ao carregar a página
  useEffect(() => {
    const fetchConsultores = async () => {
      try {
        const consultoresList = await getConsultores()
        setConsultores(consultoresList)
      } catch (error) {
        console.error("Erro ao buscar consultores:", error)
      }
    }

    fetchConsultores()
  }, [])

  // Calcular duração automaticamente
  const calcularDuracao = () => {
    if (formData.data_inicio && formData.data_termino) {
      try {
        const inicio = parseISO(formData.data_inicio)
        const termino = parseISO(formData.data_termino)
        return differenceInDays(termino, inicio) + 1
      } catch (error) {
        return 0
      }
    }
    return 0
  }

  const duracao = calcularDuracao()

  // Obter informações do porte
  const getPorteInfo = (porte: string) => {
    const portes = {
      starter: { limite: 15, nome: "Starter" },
      basic: { limite: 30, nome: "Basic" },
      pro: { limite: 45, nome: "Pro" },
      enterprise: { limite: 60, nome: "Enterprise" },
    }
    return portes[porte as keyof typeof portes] || { limite: 30, nome: "Basic" }
  }

  const porteInfo = getPorteInfo(formData.porte)
  const prazoAtingido = isPrazoAtingido(formData.tipo, duracao)

  // Calcular bônus automaticamente
  const calcularBonus = (valor: number) => {
    return {
      bonus8: valor * 0.08,
      bonus12: valor * 0.12,
    }
  }

  const { bonus8, bonus12 } = calcularBonus(formData.valor_consultoria)

  // Calcular comissão se for projeto concluído
  const calcularComissaoCompleta = () => {
    if (formData.status === "concluido") {
      return calculateCommission(formData.valor_consultoria, avaliacao, prazoAtingido)
    }
    return { percentual: 0, valor: 0 }
  }

  const { percentual: percentualComissao, valor: valorComissao } = calcularComissaoCompleta()

  const handleInputChange = (field: keyof ConsultingFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validar dados
      const validatedData = consultingSchema.parse({
        ...formData,
        valor_consultoria: Number(formData.valor_consultoria),
        avaliacao_estrelas: formData.status === "concluido" ? avaliacao : undefined,
      })

      // Preparar dados para criação
      const projectData = {
        ...validatedData,
        tempo_dias: duracao,
        valor_bonus: bonus8,
        valor_bonus_12: bonus12,
        prazo_atingido: formData.status === "concluido" ? prazoAtingido : null,
        data_finalizacao: formData.status === "concluido" ? new Date().toISOString().split("T")[0] : null,
        valor_comissao: formData.status === "concluido" ? valorComissao : 0,
        percentual_comissao: formData.status === "concluido" ? percentualComissao : 0,
      }

      console.log("Criando projeto com dados:", projectData)

      // Criar projeto
      const result = await createConsultingProject(projectData)

      if (result) {
        toast({
          title: "Consultoria criada",
          description: `A consultoria para ${formData.cliente} foi criada com sucesso.`,
        })

        // Redirecionar baseado no status
        if (formData.status === "concluido") {
          setTimeout(() => {
            router.push("/dashboard/consultoria/concluidas")
          }, 1500)
        } else {
          setTimeout(() => {
            router.push("/dashboard/consultoria/em-andamento")
          }, 1500)
        }
      } else {
        throw new Error("Falha ao criar consultoria")
      }
    } catch (error) {
      console.error("Erro ao criar consultoria:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar a consultoria.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 bg-[#0056D6] text-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nova Consultoria</h1>
            <p className="text-sm text-white/90">Cadastre uma nova consultoria no sistema</p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais da consultoria</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => handleInputChange("cliente", e.target.value)}
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange("tipo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultoria">Consultoria</SelectItem>
                    <SelectItem value="upsell">Upsell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultor">Consultor *</Label>
                <Select value={formData.consultor} onValueChange={(value) => handleInputChange("consultor", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o consultor" />
                  </SelectTrigger>
                  <SelectContent>
                    {consultores.map((consultor) => (
                      <SelectItem key={consultor} value={consultor}>
                        {consultor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="porte">Porte *</Label>
                <Select value={formData.porte} onValueChange={(value) => handleInputChange("porte", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o porte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter (até 15 dias)</SelectItem>
                    <SelectItem value="basic">Basic (até 30 dias)</SelectItem>
                    <SelectItem value="pro">Pro (até 45 dias)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (até 60 dias)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Projeto</CardTitle>
              <CardDescription>Datas e informações do projeto</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início *</Label>
                <DatePicker
                  date={formData.data_inicio ? new Date(formData.data_inicio) : undefined}
                  onSelect={(date) => handleInputChange("data_inicio", date ? format(date, "yyyy-MM-dd") : "")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_termino">Data de Término *</Label>
                <DatePicker
                  date={formData.data_termino ? new Date(formData.data_termino) : undefined}
                  onSelect={(date) => handleInputChange("data_termino", date ? format(date, "yyyy-MM-dd") : "")}
                />
              </div>

              <div className="space-y-2">
                <Label>Duração Calculada</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-lg font-semibold">{duracao} dias</div>
                  <div className="text-sm text-gray-600">
                    Limite do {porteInfo.nome}: {porteInfo.limite} dias
                  </div>
                  <div className={`text-sm ${prazoAtingido ? "text-green-600" : "text-red-600"}`}>
                    {prazoAtingido ? "✓ Dentro do prazo" : "⚠ Fora do prazo"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Financeiras</CardTitle>
              <CardDescription>Valores e cálculos automáticos</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valor_consultoria">Valor da Consultoria (R$) *</Label>
                <Input
                  id="valor_consultoria"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_consultoria}
                  onChange={(e) => handleInputChange("valor_consultoria", Number.parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Bônus Calculados</Label>
                <div className="p-3 bg-gray-50 rounded-md space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">Bônus 8%:</span> {formatCurrency(bonus8)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Bônus 12%:</span> {formatCurrency(bonus12)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campo de Avaliação - Aparece apenas se status for "concluido" */}
          {formData.status === "concluido" && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Star className="h-5 w-5" />
                  Avaliação da Consultoria
                </CardTitle>
                <CardDescription className="text-green-700">
                  Avalie a qualidade da consultoria realizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Avaliação por Estrelas</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setAvaliacao(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= avaliacao ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Avaliação: {avaliacao} {avaliacao === 1 ? "estrela" : "estrelas"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nota_consultoria">Comentários da Avaliação</Label>
                  <Textarea
                    id="nota_consultoria"
                    value={formData.nota_consultoria || ""}
                    onChange={(e) => handleInputChange("nota_consultoria", e.target.value)}
                    placeholder="Descreva os pontos positivos, áreas de melhoria e feedback geral sobre a consultoria..."
                    rows={3}
                  />
                </div>

                <div className="p-3 bg-white rounded-md border">
                  <h4 className="font-medium text-green-800 mb-2">Cálculo da Comissão</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Valor da consultoria:</span>
                      <div className="font-medium">{formatCurrency(formData.valor_consultoria)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Percentual de comissão:</span>
                      <div className="font-medium">{percentualComissao}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor da comissão:</span>
                      <div className="font-medium text-green-600">{formatCurrency(valorComissao)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Prazo atingido:</span>
                      <div className="font-medium">{prazoAtingido ? "Sim" : "Não"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar Consultoria"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
