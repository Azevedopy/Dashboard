"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Calculator } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getSupabase } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Interface for form values
interface FormValues {
  member_id: string
  date: string
  chats_abertos: number
  chats_finalizados: number
  tempo_atendimento: string
  csat_score: string
  evaluated_percentage: string
}

export default function SuporteMetricsPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [calculatedMetrics, setCalculatedMetrics] = useState<{
    taxaResolucao: number
  } | null>(null)

  // Form state
  const [formValues, setFormValues] = useState<FormValues>({
    member_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    chats_abertos: 0,
    chats_finalizados: 0,
    tempo_atendimento: "",
    csat_score: "",
    evaluated_percentage: "",
  })

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchMembers() {
      setIsLoading(true)
      try {
        const supabase = getSupabase()
        const { data, error } = await supabase.from("members").select("*").order("name")

        if (error) {
          throw error
        }

        setMembers(data || [])
      } catch (error) {
        console.error("Error fetching members:", error)
        toast({
          title: "Erro ao carregar membros",
          description: "Não foi possível carregar a lista de membros. Tente novamente mais tarde.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [])

  // Handle form input changes
  const handleChange = (field: keyof FormValues, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Função para converter tempo para minutos
  const convertToMinutes = (timeString: string): number => {
    if (!timeString || timeString.trim() === "") return 0

    // Verificar se é apenas um número (minutos)
    if (/^\d+$/.test(timeString)) {
      return Number.parseInt(timeString, 10)
    }

    // Verificar se é formato hh:mm ou h:mm
    if (timeString.includes(":")) {
      const parts = timeString.split(":")

      // Se temos formato hh:mm:ss (3 partes)
      if (parts.length === 3) {
        const hours = Number.parseInt(parts[0], 10) || 0
        const minutes = Number.parseInt(parts[1], 10) || 0
        const seconds = Number.parseInt(parts[2], 10) || 0

        // Converter para minutos decimais (horas * 60 + minutos + segundos / 60)
        return hours * 60 + minutes + seconds / 60
      }

      // Se temos formato hh:mm (2 partes)
      if (parts.length === 2) {
        const hours = Number.parseInt(parts[0], 10) || 0
        const minutes = Number.parseInt(parts[1], 10) || 0
        return hours * 60 + minutes
      }
    }

    // Se não for nenhum formato reconhecido, retornar 0
    return 0
  }

  // Função para converter string para número ou retornar 0 se vazio
  const parseNumberOrZero = (value: string): number => {
    if (!value || value.trim() === "") return 0
    const parsed = Number.parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // Função para formatar números com 2 casas decimais
  const formatDecimal = (value: number): number => {
    return Number.parseFloat(value.toFixed(2))
  }

  // Função para calcular as métricas com base nos dados inseridos
  const calculateMetrics = () => {
    const chatsAbertos = formValues.chats_abertos || 0
    const chatsFinalizados = formValues.chats_finalizados || 0

    // Calcular a taxa de resolução
    const taxaResolucao = chatsAbertos > 0 ? (chatsFinalizados / chatsAbertos) * 100 : 0

    setCalculatedMetrics({
      taxaResolucao: formatDecimal(taxaResolucao),
    })
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formValues.member_id) {
      newErrors.member_id = "Selecione um atendente"
    }

    if (!formValues.date) {
      newErrors.date = "Selecione uma data"
    }

    // Validar formato do tempo
    if (formValues.tempo_atendimento && !isValidTimeFormat(formValues.tempo_atendimento)) {
      newErrors.tempo_atendimento = "Formato inválido. Use minutos (ex: 44) ou hh:mm:ss (ex: 00:44:17)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validar formato do tempo
  const isValidTimeFormat = (timeString: string): boolean => {
    if (!timeString || timeString.trim() === "") return true

    // Aceitar apenas números (minutos)
    if (/^\d+$/.test(timeString)) return true

    // Aceitar formato hh:mm
    if (/^\d{1,2}:\d{1,2}$/.test(timeString)) return true

    // Aceitar formato hh:mm:ss
    if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(timeString)) return true

    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = getSupabase()

      // IMPORTANTE: Usar a data exatamente como foi inserida, sem ajustes de fuso horário
      const formattedDate = formValues.date

      // Converter tempo de atendimento para minutos
      const tempoTotalMinutos = convertToMinutes(formValues.tempo_atendimento)
      console.log(`Tempo de atendimento original: ${formValues.tempo_atendimento}`)
      console.log(`Tempo convertido para minutos: ${tempoTotalMinutos}`)

      // Calcular a taxa de resolução
      const chatsAbertos = formValues.chats_abertos || 0
      const chatsFinalizados = formValues.chats_finalizados || 0
      const taxaResolucao = chatsAbertos > 0 ? (chatsFinalizados / chatsAbertos) * 100 : 0

      // Calcular o tempo médio de atendimento
      // IMPORTANTE: Não dividir pelo número de chats finalizados aqui
      // Vamos salvar o tempo total em minutos diretamente
      const tempoMedio = tempoTotalMinutos

      // Formatar valores com 2 casas decimais
      const formattedResolutionRate = formatDecimal(taxaResolucao)
      const formattedAverageResponseTime = formatDecimal(tempoMedio)
      const formattedCsatScore = formatDecimal(parseNumberOrZero(formValues.csat_score))
      const formattedEvaluatedPercentage = formatDecimal(parseNumberOrZero(formValues.evaluated_percentage))

      // Preparar os dados para salvar
      const metricsData = {
        member_id: formValues.member_id,
        date: formattedDate,
        resolution_rate: formattedResolutionRate,
        average_response_time: formattedAverageResponseTime,
        csat_score: formattedCsatScore,
        evaluated_percentage: formattedEvaluatedPercentage,
        open_tickets: chatsAbertos,
        resolved_tickets: chatsFinalizados,
      }

      console.log("Enviando dados para Supabase:", metricsData)

      // Inserir os dados calculados na tabela metrics
      const { data: insertedData, error } = await supabase.from("metrics").insert([metricsData]).select()

      if (error) {
        throw new Error(`Erro ao inserir dados: ${error.message}`)
      }

      const member = members.find((m) => m.id === formValues.member_id)
      toast({
        title: "Métricas de suporte cadastradas com sucesso",
        description: `Métricas de ${member?.name} para ${format(parseISO(formattedDate), "dd/MM/yyyy", { locale: ptBR })} foram salvas.`,
      })

      // Reset form (but keep the member and date)
      setFormValues({
        member_id: formValues.member_id,
        date: formValues.date,
        chats_abertos: 0,
        chats_finalizados: 0,
        tempo_atendimento: "",
        csat_score: "",
        evaluated_percentage: "",
      })

      // Limpar métricas calculadas
      setCalculatedMetrics(null)
    } catch (error) {
      console.error("Error creating support metrics:", error)
      toast({
        title: "Erro ao cadastrar métricas de suporte",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar as métricas. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-6 bg-[#0056D6] text-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4 text-white hover:bg-white/20">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Cadastro de Métricas de Suporte</h1>
          <p className="text-sm text-white/90">Adicionar métricas de atendimento de suporte</p>
        </div>
      </div>

      <div className="p-6 overflow-auto">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Dados de Métricas de Suporte</CardTitle>
            <CardDescription>
              Preencha os dados de atendimento para calcular automaticamente as métricas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Carregando membros...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="member_id">Atendente</Label>
                    <Select value={formValues.member_id} onValueChange={(value) => handleChange("member_id", value)}>
                      <SelectTrigger id="member_id">
                        <SelectValue placeholder="Selecione um atendente" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.member_id && <p className="text-sm text-red-500">{errors.member_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formValues.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                    />
                    {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chats_abertos">Chats Abertos</Label>
                    <Input
                      id="chats_abertos"
                      type="number"
                      min="0"
                      value={formValues.chats_abertos}
                      onChange={(e) => handleChange("chats_abertos", Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chats_finalizados">Chats Finalizados</Label>
                    <Input
                      id="chats_finalizados"
                      type="number"
                      min="0"
                      value={formValues.chats_finalizados}
                      onChange={(e) => handleChange("chats_finalizados", Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tempo_atendimento">Tempo de Atendimento</Label>
                    <Input
                      id="tempo_atendimento"
                      type="text"
                      placeholder="Ex: 44 ou 00:44:17"
                      value={formValues.tempo_atendimento}
                      onChange={(e) => handleChange("tempo_atendimento", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: minutos (ex: 44) ou horas:minutos:segundos (ex: 00:44:17)
                    </p>
                    {errors.tempo_atendimento && <p className="text-sm text-red-500">{errors.tempo_atendimento}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="csat_score">Média CSAT (0-5)</Label>
                    <Input
                      id="csat_score"
                      type="text"
                      placeholder="Ex: 4.5"
                      value={formValues.csat_score}
                      onChange={(e) => handleChange("csat_score", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Média de satisfação dos clientes (0-5 estrelas)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="evaluated_percentage">% de Atendimentos Avaliados</Label>
                    <Input
                      id="evaluated_percentage"
                      type="text"
                      placeholder="Ex: 75.5"
                      value={formValues.evaluated_percentage}
                      onChange={(e) => handleChange("evaluated_percentage", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Percentual de atendimentos que receberam avaliação</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <Button type="button" variant="outline" onClick={calculateMetrics} className="gap-2">
                    <Calculator className="h-4 w-4" />
                    Calcular Métricas
                  </Button>

                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Salvando..." : "Salvar Métricas"}
                  </Button>
                </div>

                {calculatedMetrics && (
                  <Alert className="mt-4 bg-slate-50">
                    <AlertTitle>Métricas Calculadas</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
                        <p className="text-sm font-medium">Taxa de Resolução</p>
                        <p className="text-lg font-bold">{calculatedMetrics.taxaResolucao}%</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
