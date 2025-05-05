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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

// Form schema para métricas de suporte
const supportFormSchema = z.object({
  member_id: z.string().min(1, { message: "Selecione um atendente" }),
  date: z.string().min(1, { message: "Selecione uma data" }),
  total_atendimentos: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  atendimentos_resolvidos: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  atendimentos_avaliados: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  soma_avaliacoes: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
})

// Form schema para métricas gerais
const generalFormSchema = z.object({
  member_id: z.string().min(1, { message: "Selecione um atendente" }),
  date: z.string().min(1, { message: "Selecione uma data" }),
  resolution_rate: z.coerce.number().min(0).max(100, { message: "Valor deve estar entre 0 e 100" }),
  average_response_time: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  csat_score: z.coerce.number().min(1).max(5, { message: "Valor deve estar entre 1 e 5" }),
  evaluated_percentage: z.coerce.number().min(0).max(100, { message: "Valor deve estar entre 0 e 100" }),
  open_tickets: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  resolved_tickets: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
})

// Form schema específico para o Genier
const genierFormSchema = z.object({
  date: z.string().min(1, { message: "Selecione uma data" }),
  artigos_publicados: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  atendimentos_agente_virtual: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  resolvidos_agente_virtual: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  nao_resolvidos_agente_virtual: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  materiais_registrados: z.string(),
  materiais_faltantes: z.string(),
})

type SupportFormValues = z.infer<typeof supportFormSchema>
type GeneralFormValues = z.infer<typeof generalFormSchema>
type GenierFormValues = z.infer<typeof genierFormSchema>

export default function MetricsRegistrationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("general")
  const [calculatedMetrics, setCalculatedMetrics] = useState<{
    taxaResolucao: number
    mediaAvaliacao: number
    percentualAvaliados: number
  } | null>(null)

  // Formulário para métricas gerais
  const generalForm = useForm<GeneralFormValues>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      member_id: "",
      date: new Date().toISOString().split("T")[0],
      resolution_rate: 80,
      average_response_time: 10,
      csat_score: 4.5,
      evaluated_percentage: 75,
      open_tickets: 5,
      resolved_tickets: 20,
    },
  })

  // Formulário para métricas de suporte
  const supportForm = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      member_id: "",
      date: new Date().toISOString().split("T")[0],
      total_atendimentos: 25,
      atendimentos_resolvidos: 20,
      atendimentos_avaliados: 15,
      soma_avaliacoes: 60,
    },
  })

  // Formulário específico para o Genier
  const genierForm = useForm<GenierFormValues>({
    resolver: zodResolver(genierFormSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      artigos_publicados: 0,
      atendimentos_agente_virtual: 0,
      resolvidos_agente_virtual: 0,
      nao_resolvidos_agente_virtual: 0,
      materiais_registrados: "",
      materiais_faltantes: "",
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

  // Função para calcular as métricas com base nos dados inseridos
  const calculateMetrics = () => {
    const values = supportForm.getValues()
    const totalAtendimentos = values.total_atendimentos
    const atendimentosResolvidos = values.atendimentos_resolvidos
    const atendimentosAvaliados = values.atendimentos_avaliados
    const somaAvaliacoes = values.soma_avaliacoes

    // Calcular as métricas
    const taxaResolucao = totalAtendimentos > 0 ? (atendimentosResolvidos / totalAtendimentos) * 100 : 0
    const mediaAvaliacao = atendimentosAvaliados > 0 ? somaAvaliacoes / atendimentosAvaliados : 0
    const percentualAvaliados = totalAtendimentos > 0 ? (atendimentosAvaliados / totalAtendimentos) * 100 : 0

    setCalculatedMetrics({
      taxaResolucao: Number.parseFloat(taxaResolucao.toFixed(2)),
      mediaAvaliacao: Number.parseFloat(mediaAvaliacao.toFixed(1)),
      percentualAvaliados: Number.parseFloat(percentualAvaliados.toFixed(2)),
    })
  }

  const onSubmitGeneral = async (data: GeneralFormValues) => {
    setIsSubmitting(true)

    try {
      const supabase = getSupabase()

      console.log("Enviando dados para Supabase:", {
        member_id: data.member_id,
        date: data.date,
        resolution_rate: data.resolution_rate,
        average_response_time: data.average_response_time,
        csat_score: data.csat_score,
        evaluated_percentage: data.evaluated_percentage,
        open_tickets: data.open_tickets,
        resolved_tickets: data.resolved_tickets,
      })

      // Inserir métricas diretamente na tabela
      const { error } = await supabase.from("metrics").insert([
        {
          member_id: data.member_id,
          date: data.date,
          resolution_rate: data.resolution_rate,
          average_response_time: data.average_response_time,
          csat_score: data.csat_score,
          evaluated_percentage: data.evaluated_percentage,
          open_tickets: data.open_tickets,
          resolved_tickets: data.resolved_tickets,
        },
      ])

      if (error) {
        console.error("Insert error:", error)
        throw new Error(`Erro ao inserir dados: ${error.message}`)
      }

      const member = members.find((m) => m.id === data.member_id)
      toast({
        title: "Métricas cadastradas com sucesso",
        description: `Métricas de ${member?.name} para ${new Date(data.date).toLocaleDateString("pt-BR")} foram salvas.`,
      })

      // Reset form (but keep the member and date)
      const member_id = generalForm.getValues("member_id")
      const date = generalForm.getValues("date")
      generalForm.reset({
        member_id,
        date,
        resolution_rate: 80,
        average_response_time: 10,
        csat_score: 4.5,
        evaluated_percentage: 75,
        open_tickets: 5,
        resolved_tickets: 20,
      })
    } catch (error) {
      console.error("Error creating metrics:", error)
      toast({
        title: "Erro ao cadastrar métricas",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar as métricas. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitSupport = async (data: SupportFormValues) => {
    setIsSubmitting(true)

    try {
      const supabase = getSupabase()

      // Calcular as métricas
      const totalAtendimentos = data.total_atendimentos
      const atendimentosResolvidos = data.atendimentos_resolvidos
      const atendimentosAvaliados = data.atendimentos_avaliados
      const somaAvaliacoes = data.soma_avaliacoes

      const taxaResolucao = totalAtendimentos > 0 ? (atendimentosResolvidos / totalAtendimentos) * 100 : 0
      const mediaAvaliacao = atendimentosAvaliados > 0 ? somaAvaliacoes / atendimentosAvaliados : 0
      const percentualAvaliados = totalAtendimentos > 0 ? (atendimentosAvaliados / totalAtendimentos) * 100 : 0

      console.log("Enviando dados calculados para Supabase:", {
        member_id: data.member_id,
        date: data.date,
        resolution_rate: taxaResolucao,
        average_response_time: 0,
        csat_score: mediaAvaliacao,
        evaluated_percentage: percentualAvaliados,
        open_tickets: totalAtendimentos - atendimentosResolvidos,
        resolved_tickets: atendimentosResolvidos,
      })

      // Inserir os dados calculados na tabela metrics
      const { error } = await supabase.from("metrics").insert([
        {
          member_id: data.member_id,
          date: data.date,
          resolution_rate: taxaResolucao,
          average_response_time: 0,
          csat_score: mediaAvaliacao,
          evaluated_percentage: percentualAvaliados,
          open_tickets: totalAtendimentos - atendimentosResolvidos,
          resolved_tickets: atendimentosResolvidos,
        },
      ])

      if (error) {
        console.error("Insert error:", error)
        throw new Error(`Erro ao inserir dados: ${error.message}`)
      }

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
        total_atendimentos: 25,
        atendimentos_resolvidos: 20,
        atendimentos_avaliados: 15,
        soma_avaliacoes: 60,
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

  const onSubmitGenier = async (data: GenierFormValues) => {
    setIsSubmitting(true)

    try {
      const supabase = getSupabase()

      console.log("Enviando dados do Genier para Supabase:", {
        date: data.date,
        artigos_publicados: data.artigos_publicados,
        atendimentos_agente_virtual: data.atendimentos_agente_virtual,
        resolvidos_agente_virtual: data.resolvidos_agente_virtual,
        nao_resolvidos_agente_virtual: data.nao_resolvidos_agente_virtual,
        materiais_registrados: data.materiais_registrados,
        materiais_faltantes: data.materiais_faltantes,
      })

      // Calcular a taxa de resolução
      const totalAtendimentos = data.atendimentos_agente_virtual
      const atendimentosResolvidos = data.resolvidos_agente_virtual
      const taxaResolucao = totalAtendimentos > 0 ? (atendimentosResolvidos / totalAtendimentos) * 100 : 0

      // Inserir métricas do Genier diretamente na tabela metrics_genier
      const { error } = await supabase.from("metrics_genier").insert([
        {
          data: data.date, // Usando o nome do campo conforme esperado pela tabela
          artigos_publicados: data.artigos_publicados,
          atendimentos_agente_virtual: data.atendimentos_agente_virtual,
          resolvidos_agente_virtual: data.resolvidos_agente_virtual,
          nao_resolvidos_agente_virtual: data.nao_resolvidos_agente_virtual,
          materiais_registrados: data.materiais_registrados,
          materiais_faltantes: data.materiais_faltantes,
          taxa_resolucao: taxaResolucao.toFixed(2),
        },
      ])

      if (error) {
        console.error("Insert error:", error)
        throw new Error(`Erro ao inserir dados: ${error.message}`)
      }

      toast({
        title: "Métricas do Genier cadastradas com sucesso",
        description: `Métricas do Genier para ${new Date(data.date).toLocaleDateString("pt-BR")} foram salvas.`,
      })

      // Reset form (but keep the date)
      const date = genierForm.getValues("date")
      genierForm.reset({
        date,
        artigos_publicados: 0,
        atendimentos_agente_virtual: 0,
        resolvidos_agente_virtual: 0,
        nao_resolvidos_agente_virtual: 0,
        materiais_registrados: "",
        materiais_faltantes: "",
      })
    } catch (error) {
      console.error("Error creating Genier metrics:", error)
      toast({
        title: "Erro ao cadastrar métricas do Genier",
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
          <h1 className="text-2xl font-bold">Cadastro de Métricas</h1>
          <p className="text-sm text-muted-foreground">Adicionar métricas de atendimento</p>
        </div>
      </div>

      <div className="p-6 overflow-auto">
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general">Métricas Gerais</TabsTrigger>
            <TabsTrigger value="support">Métricas de Suporte</TabsTrigger>
            <TabsTrigger value="genier">Métricas Genier</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Dados de Métricas Gerais</CardTitle>
                <CardDescription>Preencha os dados de métricas para o atendente selecionado.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Carregando membros...</p>
                  </div>
                ) : (
                  <Form {...generalForm}>
                    <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={generalForm.control}
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
                          control={generalForm.control}
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
                          control={generalForm.control}
                          name="resolution_rate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Taxa de Resolução (%)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" max="100" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="average_response_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tempo Médio de Atendimento (min)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="0.1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="csat_score"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CSAT Médio (1-5)</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" max="5" step="0.1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="evaluated_percentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>% de Atendimentos Avaliados</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" max="100" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="open_tickets"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Atendimentos Abertos</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={generalForm.control}
                          name="resolved_tickets"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Atendimentos Resolvidos</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                          <Save className="h-4 w-4" />
                          {isSubmitting ? "Salvando..." : "Salvar Métricas"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Dados de Métricas de Suporte</CardTitle>
                <CardDescription>
                  Preencha os dados brutos de atendimento para calcular automaticamente as métricas.
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
                          name="total_atendimentos"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total de Atendimentos</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={supportForm.control}
                          name="atendimentos_resolvidos"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Atendimentos Resolvidos</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={supportForm.control}
                          name="atendimentos_avaliados"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Atendimentos Avaliados</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={supportForm.control}
                          name="soma_avaliacoes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Soma das Avaliações</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" {...field} />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                Soma de todas as avaliações recebidas (ex: 3 avaliações de 5 estrelas = 15)
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                              <div>
                                <p className="text-sm font-medium">Taxa de Resolução</p>
                                <p className="text-lg font-bold">{calculatedMetrics.taxaResolucao}%</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Média de Avaliação (CSAT)</p>
                                <p className="text-lg font-bold">{calculatedMetrics.mediaAvaliacao}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">% Atendimentos Avaliados</p>
                                <p className="text-lg font-bold">{calculatedMetrics.percentualAvaliados}%</p>
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
          </TabsContent>

          <TabsContent value="genier">
            <Card className="max-w-2xl mx-auto bg-black text-white">
              <CardHeader>
                <CardTitle>Métricas Genier</CardTitle>
                <CardDescription className="text-gray-400">
                  Preencha os dados de métricas do Genier para a data selecionada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...genierForm}>
                  <form onSubmit={genierForm.handleSubmit(onSubmitGenier)} className="space-y-6">
                    <div className="mb-4">
                      <FormField
                        control={genierForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Data</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} className="bg-gray-900 border-gray-700 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <FormField
                          control={genierForm.control}
                          name="artigos_publicados"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Artigos Publicados</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  className="bg-gray-900 border-gray-700 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <FormField
                          control={genierForm.control}
                          name="atendimentos_agente_virtual"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Atendimentos do Agente Virtual</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  className="bg-gray-900 border-gray-700 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <FormField
                          control={genierForm.control}
                          name="resolvidos_agente_virtual"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Resolvidos pelo Agente Virtual</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  className="bg-gray-900 border-gray-700 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <FormField
                          control={genierForm.control}
                          name="nao_resolvidos_agente_virtual"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Não Resolvidos pelo Agente Virtual</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  {...field}
                                  className="bg-gray-900 border-gray-700 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <FormField
                          control={genierForm.control}
                          name="materiais_registrados"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Materiais Registrados</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Digite um material por linha"
                                  className="h-24 bg-gray-900 border-gray-700 text-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <FormField
                          control={genierForm.control}
                          name="materiais_faltantes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Materiais Faltantes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Digite um material por linha"
                                  className="h-24 bg-gray-900 border-gray-700 text-white"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => genierForm.reset()}
                        className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        Limpar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {isSubmitting ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}
