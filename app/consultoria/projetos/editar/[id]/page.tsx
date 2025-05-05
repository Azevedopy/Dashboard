"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getConsultingProjectById, updateConsultingProject } from "@/lib/consulting-service"
import { getMembers } from "@/lib/members-service"
import { formatCurrency } from "@/lib/utils"
import type { ConsultingProject, Member } from "@/lib/types"

// Schema de validação
const formSchema = z.object({
  cliente: z.string().min(2, { message: "O nome do cliente é obrigatório" }),
  consultor: z.string().min(1, { message: "O consultor é obrigatório" }),
  tipo: z.string().min(1, { message: "O tipo é obrigatório" }),
  porte: z.string().min(1, { message: "O porte é obrigatório" }),
  data_inicio: z.date({ required_error: "A data de início é obrigatória" }),
  data_termino: z.date({ required_error: "A data de término é obrigatória" }),
  tempo_dias: z.coerce.number().min(1, { message: "A duração deve ser maior que zero" }),
  valor_consultoria: z.coerce.number().min(0, { message: "O valor deve ser maior ou igual a zero" }),
  status: z.string().min(1, { message: "O status é obrigatório" }),
  data_fechamento: z.date().optional().nullable(),
  data_virada: z.date().optional().nullable(),
})

type FormValues = z.infer<typeof formSchema>

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [project, setProject] = useState<ConsultingProject | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [valorConsultoria, setValorConsultoria] = useState(0)

  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente: "",
      consultor: "",
      tipo: "Consultoria", // Usando o valor com inicial maiúscula
      porte: "",
      data_inicio: new Date(),
      data_termino: new Date(),
      tempo_dias: 0,
      valor_consultoria: 0,
      status: "em_andamento",
      data_fechamento: null,
      data_virada: null,
    },
  })

  // Calcular os valores de bônus
  const bonus8Percent = (valorConsultoria * 0.08).toFixed(2)
  const bonus12Percent = (valorConsultoria * 0.12).toFixed(2)

  // Buscar membros
  useEffect(() => {
    async function fetchMembers() {
      setIsLoadingMembers(true)
      try {
        const data = await getMembers()
        setMembers(data)
      } catch (error) {
        console.error("Error fetching members:", error)
        toast({
          title: "Erro ao carregar membros",
          description: "Não foi possível carregar a lista de membros. Tente novamente mais tarde.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingMembers(false)
      }
    }

    fetchMembers()
  }, [])

  // Buscar dados do projeto
  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string)
    }
  }, [params.id])

  // Atualizar valor da consultoria quando o campo mudar
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === "valor_consultoria" && value.valor_consultoria !== undefined) {
        setValorConsultoria(Number(value.valor_consultoria))
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const fetchProject = async (id: string) => {
    setIsLoading(true)
    try {
      const data = await getConsultingProjectById(id)
      if (data) {
        // Log para verificar a estrutura exata dos dados
        console.log("Projeto carregado (estrutura completa):", data)
        console.log("Chaves do objeto:", Object.keys(data))
        console.log("Valor do campo tipo:", data.tipo)

        setProject(data)

        // Definir valores iniciais para o formulário
        const formValues = {
          cliente: data.cliente || "",
          consultor: data.consultor || "",
          tipo: data.tipo || "Consultoria",
          porte: data.porte || "",
          data_inicio: data.data_inicio ? new Date(data.data_inicio) : new Date(),
          data_termino: data.data_termino ? new Date(data.data_termino) : new Date(),
          tempo_dias: data.tempo_dias || 0,
          valor_consultoria: data.valor_consultoria || 0,
          status: data.status || "em_andamento",
          data_fechamento: data.data_fechamento ? new Date(data.data_fechamento) : null,
          data_virada: data.data_virada ? new Date(data.data_virada) : null,
        }

        // Atualizar o formulário
        form.reset(formValues)

        // Atualizar o valor da consultoria para os cálculos de bônus
        setValorConsultoria(data.valor_consultoria || 0)
      } else {
        toast({
          title: "Projeto não encontrado",
          description: "O projeto solicitado não foi encontrado.",
          variant: "destructive",
        })
        router.push("/consultoria/projetos")
      }
    } catch (error) {
      console.error("Error fetching project:", error)
      toast({
        title: "Erro ao carregar projeto",
        description: "Não foi possível carregar os dados do projeto. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Enviar formulário
  const onSubmit = async (values: FormValues) => {
    if (!project) return

    setIsSaving(true)
    try {
      // Preparar dados para envio
      const updatedProject: Partial<ConsultingProject> = {
        ...values,
        id: project.id,
        data_inicio: values.data_inicio.toISOString(),
        data_termino: values.data_termino.toISOString(),
        data_fechamento: values.data_fechamento ? values.data_fechamento.toISOString() : null,
        data_virada: values.data_virada ? values.data_virada.toISOString() : null,
      }

      console.log("Dados a serem enviados:", updatedProject)

      // Enviar para API
      await updateConsultingProject(updatedProject)

      toast({
        title: "Projeto atualizado",
        description: "O projeto foi atualizado com sucesso.",
      })

      // Redirecionar para página de detalhes
      router.push(`/consultoria/projetos/${project.id}`)
    } catch (error) {
      console.error("Error updating project:", error)
      toast({
        title: "Erro ao atualizar projeto",
        description: "Não foi possível atualizar o projeto. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Calcular duração em dias
  const calculateDuration = () => {
    const startDate = form.getValues("data_inicio")
    const endDate = form.getValues("data_termino")

    if (startDate && endDate && startDate instanceof Date && endDate instanceof Date) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      form.setValue("tempo_dias", diffDays, { shouldValidate: true })
    }
  }

  // Função para lidar com mudanças nas datas
  const handleDateChange = (field: any, date: Date | undefined | null) => {
    if (date) {
      field.onChange(date)
      // Usar setTimeout para garantir que o estado seja atualizado antes de calcular
      setTimeout(calculateDuration, 0)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Editar Projeto</h1>
          <p className="text-sm text-muted-foreground">Atualize as informações do projeto de consultoria</p>
        </div>
        <Button
          type="submit"
          form="edit-project-form"
          disabled={isSaving}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            "Salvando..."
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
          </div>
        ) : (
          <Form {...form}>
            <form id="edit-project-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Dados principais do projeto</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cliente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Consultoria">Consultoria</SelectItem>
                            <SelectItem value="Upsell">Upsell</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consultor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consultor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o consultor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingMembers ? (
                              <SelectItem value="loading" disabled>
                                Carregando consultores...
                              </SelectItem>
                            ) : members.length > 0 ? (
                              members.map((member) => (
                                <SelectItem key={member.id} value={member.name}>
                                  {member.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>
                                Nenhum membro encontrado
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="porte"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porte</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o porte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Starter">Starter</SelectItem>
                            <SelectItem value="Pro">Pro</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Projeto</CardTitle>
                  <CardDescription>Informações detalhadas sobre o projeto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="data_inicio"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Início</FormLabel>
                          <DatePicker date={field.value} setDate={(date) => handleDateChange(field, date)} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data_termino"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Término</FormLabel>
                          <DatePicker date={field.value} setDate={(date) => handleDateChange(field, date)} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tempo_dias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração (dias)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="data_fechamento"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Fechamento</FormLabel>
                          <DatePicker date={field.value} setDate={(date) => field.onChange(date)} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data_virada"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Virada</FormLabel>
                          <DatePicker date={field.value} setDate={(date) => field.onChange(date)} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações Financeiras</CardTitle>
                  <CardDescription>Dados financeiros do projeto</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="valor_consultoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Consultoria (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              setValorConsultoria(Number(e.target.value))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Bônus (8%)</div>
                    <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                      {formatCurrency(Number.parseFloat(bonus8Percent))}
                    </div>
                    <p className="text-xs text-muted-foreground">Valor calculado como 8% do valor da consultoria</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Bônus (12%)</div>
                    <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                      {formatCurrency(Number.parseFloat(bonus12Percent))}
                    </div>
                    <p className="text-xs text-muted-foreground">Valor calculado como 12% do valor da consultoria</p>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        )}
      </div>
      <Toaster />
    </div>
  )
}
