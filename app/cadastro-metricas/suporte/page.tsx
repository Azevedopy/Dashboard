"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Save, Calculator } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getSupabase } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Form schema para métricas de suporte
const supportFormSchema = z.object({
  member_id: z.string().min(1, { message: "Selecione um atendente" }),
  date: z.string().min(1, { message: "Selecione uma data" }),
  chats_abertos: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  chats_finalizados: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  tempo_atendimento: z.string().min(1, { message: "Informe o tempo de atendimento" }),
  csat_score: z.string().optional(),
  evaluated_percentage: z.string().optional(),
})

type SupportFormValues = z.infer<typeof supportFormSchema>

export default function SuporteMetricsPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [calculatedMetrics, setCalculatedMetrics] = useState<{
    taxaResolucao: number
    tempoMedio: number
  } | null>(null)

  // Formulário para métricas de suporte
  const supportForm = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      member_id: "",
      date: new Date().toISOString().split("T")[0],
      chats_abertos: 0,
      chats_finalizados: 0,
      tempo_atendimento: "00:00:00",
      csat_score: "",
      evaluated_percentage: "",
    },
  })

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

  // Função para converter tempo (hh:mm:ss) para minutos
  const convertTimeToMinutes = (timeString: string): number => {
    const [hours = "0", minutes = "0", seconds = "0"] = timeString.split(":").map(Number)
    return hours * 60 + minutes + seconds / 60
  }

  // Função para converter string para número ou retornar 0 se vazio
  const parseNumberOrZero = (value: string | undefined): number => {
    if (!value || value.trim() === "") return 0
    const parsed = Number.parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // Função para calcular as métricas com base nos dados inseridos
  const calculateMetrics = () => {
    const values = supportForm.getValues()
    const chatsAbertos = values.chats_abertos
    const chatsFinalizados = values.chats_finalizados
    const tempoAtendimento = values.tempo_atendimento

    // Converter tempo de atendimento para minutos
    const tempoTotalMinutos = convertTimeToMinutes(tempoAtendimento)

    // Calcular as métricas
    const taxaResolucao = chatsAbertos > 0 ? (chatsFinalizados / chatsAbertos) * 100 : 0
    const tempoMedio = chatsFinalizados > 0 ? tempoTotalMinutos / chatsFinalizados : 0

    setCalculatedMetrics({
      taxaResolucao: Number.parseFloat(taxaResolucao.toFixed(2)),
      tempoMedio: Number.parseFloat(tempoMedio.toFixed(2)),
    })
  }

  // No método onSubmitSupport, vamos adicionar logs para debug e garantir que a data esteja sendo tratada corretamente

  const onSubmitSupport = async (data: SupportFormValues) => {
    setIsSubmitting(true)

    try {
      const supabase = getSupabase()

      // Converter tempo de atendimento para minutos
      const tempoTotalMinutos = convertTimeToMinutes(data.tempo_atendimento)

      // Calcular a taxa de resolução
      const taxaResolucao = data.chats_abertos > 0 ? (data.chats_finalizados / data.chats_abertos) * 100 : 0

      // Calcular o tempo médio de atendimento
      const tempoMedio = data.chats_finalizados > 0 ? tempoTotalMinutos / data.chats_finalizados : 0

      // Preparar os dados para salvar
      const metricsData = {
        member_id: data.member_id,
        date: data.date,
        resolution_rate: taxaResolucao,
        average_response_time: tempoMedio,
        csat_score: parseNumberOrZero(data.csat_score),
        evaluated_percentage: parseNumberOrZero(data.evaluated_percentage),
        open_tickets: data.chats_abertos,
        resolved_tickets: data.chats_finalizados,
      }

      console.log("Enviando dados calculados para Supabase:", metricsData)

      // Inserir os dados calculados na tabela metrics
      const { data: insertedData, error } = await supabase.from("metrics").insert([metricsData]).select()

      if (error) {
        console.error("Insert error:", error)
        throw new Error(`Erro ao inserir dados: ${error.message}`)
      }

      console.log("Dados inseridos com sucesso:", insertedData)

      const member = members.find((m) => m.id === data.member_id)
      toast({
        title: "Métricas de suporte cadastradas com sucesso",
        description: `Métricas de ${member?.name} para ${new Date(data.date).toLocaleDateString("pt-BR")} foram salvas.`,
      })

      // Reset form (but keep the member and date)
      const member_id = supportForm.getValues("member_id")
      const date = supportForm.getValues("date")
      supportForm.reset({
        member_id,
        date,
        chats_abertos: 0,
        chats_finalizados: 0,
        tempo_atendimento: "00:00:00",
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
      <div className="flex items-center p-6 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Cadastro de Métricas de Suporte</h1>
          <p className="text-sm text-muted-foreground">Adicionar métricas de atendimento de suporte</p>
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
              <Form {...supportForm}>
                <form onSubmit={supportForm.handleSubmit(onSubmitSupport)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={supportForm.control}
                      name="member_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Atendente</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um atendente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supportForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supportForm.control}
                      name="chats_abertos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chats Abertos</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supportForm.control}
                      name="chats_finalizados"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chats Finalizados</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supportForm.control}
                      name="tempo_atendimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tempo de Atendimento (hh:mm:ss)</FormLabel>
                          <FormControl>
                            <Input type="time" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Tempo total gasto em todos os atendimentos (será convertido para minutos)
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supportForm.control}
                      name="csat_score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Média CSAT (0-5)</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="Ex: 4.5" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Média de satisfação dos clientes (0-5 estrelas)
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={supportForm.control}
                      name="evaluated_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>% de Atendimentos Avaliados</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="Ex: 75.5" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Percentual de atendimentos que receberam avaliação
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={calculateMetrics}
                      className="gap-2"
                      disabled={!supportForm.formState.isValid}
                    >
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-sm font-medium">Taxa de Resolução</p>
                            <p className="text-lg font-bold">{calculatedMetrics.taxaResolucao}%</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Tempo Médio de Atendimento</p>
                            <p className="text-lg font-bold">{calculatedMetrics.tempoMedio} minutos</p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
