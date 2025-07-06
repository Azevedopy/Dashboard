"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Save, CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { getConsultingProject, updateConsultingProject } from "@/lib/consulting-service"
import { getMembers } from "@/lib/members-service"
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

  // Estados para os erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Definir os portes conforme o padrão
  const portes = [
    { value: "basic", label: "Basic" },
    { value: "starter", label: "Starter" },
    { value: "pro", label: "Pro" },
    { value: "enterprise", label: "Enterprise" },
  ]

  // Definir os tipos conforme os dados existentes no banco
  const tipos = [
    { value: "Consultoria", label: "Consultoria" },
    { value: "Upsell", label: "Upsell" },
  ]

  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente: "",
      consultor: "",
      tipo: "Consultoria",
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
      const data = await getConsultingProject(id)
      if (data) {
        console.log("Projeto carregado:", data)
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

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    const values = form.getValues()

    if (!values.cliente) newErrors.cliente = "Cliente é obrigatório"
    if (!values.tipo) newErrors.tipo = "Tipo é obrigatório"
    if (!values.consultor) newErrors.consultor = "Consultor é obrigatório"
    if (!values.status) newErrors.status = "Status é obrigatório"
    if (!values.porte) newErrors.porte = "Porte é obrigatório"
    if (!values.data_inicio) newErrors.data_inicio = "Data de início é obrigatória"
    if (!values.data_termino) newErrors.data_termino = "Data de término é obrigatória"

    // Validar se a data de término é posterior à data de início
    if (values.data_inicio && values.data_termino && values.data_inicio > values.data_termino) {
      newErrors.data_termino = "A data de término deve ser posterior à data de início"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enviar formulário
  const onSubmit = async (values: FormValues) => {
    if (!project) return

    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário antes de enviar.",
        variant: "destructive",
      })
      return
    }

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
        title: "Projeto atualizado com sucesso",
        description: `O projeto foi atualizado para ${values.consultor}.`,
      })

      // Aguardar um pouco e redirecionar
      setTimeout(() => {
        router.push("/dashboard/consultoria/em-andamento")
      }, 1500)
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

  // Obter limite de dias baseado no porte
  const getPorteLimit = (porteValue: string): number => {
    const porteLimits = {
      basic: 15,
      starter: 25,
      pro: 40,
      enterprise: 60,
    }
    return porteLimits[porteValue as keyof typeof porteLimits] || 0
  }

  // Calcular informações do projeto
  const calculateProjectInfo = () => {
    const porte = form.getValues("porte")
    const duration = form.getValues("tempo_dias")
    const porteLimit = getPorteLimit(porte)
    const daysUsed = duration
    const isWithinLimit = daysUsed <= porteLimit && daysUsed > 0

    return {
      daysUsed,
      porteLimit,
      isWithinLimit,
    }
  }

  const projectInfo = calculateProjectInfo()

  return (
    <div className="container mx-auto py-6">
      <div className="p-6 bg-[#0056D6] text-white flex items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Projeto</h1>
            <p className="text-sm text-white/90">Atualize as informações do projeto de consultoria</p>
          </div>
        </div>
      </div>

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
          <form id="edit-project-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Informações Básicas</h2>
                  <p className="text-sm text-muted-foreground">Dados principais do projeto</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cliente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do cliente"
                            {...field}
                            className={errors.cliente ? "border-red-500" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                        {errors.cliente && <p className="text-sm text-red-500">{errors.cliente}</p>}
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
                            <SelectTrigger className={errors.tipo ? "border-red-500" : ""}>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tipos.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {errors.tipo && <p className="text-sm text-red-500">{errors.tipo}</p>}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="consultor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Consultor {isLoadingMembers && <span className="text-xs">(Carregando...)</span>}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingMembers}>
                          <FormControl>
                            <SelectTrigger className={errors.consultor ? "border-red-500" : ""}>
                              <SelectValue
                                placeholder={isLoadingMembers ? "Carregando consultores..." : "Selecione um consultor"}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {members.length > 0 ? (
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
                        {errors.consultor && <p className="text-sm text-red-500">{errors.consultor}</p>}
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
                            <SelectTrigger className={errors.status ? "border-red-500" : ""}>
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
                        {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
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
                            <SelectTrigger className={errors.porte ? "border-red-500" : ""}>
                              <SelectValue placeholder="Selecione o porte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {portes.map((porte) => (
                              <SelectItem key={porte.value} value={porte.value}>
                                {porte.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {errors.porte && <p className="text-sm text-red-500">{errors.porte}</p>}
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Detalhes do Projeto</h2>
                  <p className="text-sm text-muted-foreground">Informações detalhadas sobre o projeto</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="data_inicio"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Início</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                  errors.data_inicio && "border-red-500",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => handleDateChange(field, date)}
                              disabled={(date) => date > new Date("2030-01-01") || date < new Date("2020-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                        {errors.data_inicio && <p className="text-sm text-red-500">{errors.data_inicio}</p>}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_termino"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Término</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                  errors.data_termino && "border-red-500",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => handleDateChange(field, date)}
                              disabled={(date) => date > new Date("2030-01-01") || date < new Date("2020-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                        {errors.data_termino && <p className="text-sm text-red-500">{errors.data_termino}</p>}
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

                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-900 mb-3">Informações do Projeto</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Dias utilizados:</span>
                          <p
                            className={`text-lg font-bold ${
                              projectInfo.isWithinLimit ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {projectInfo.daysUsed} dias
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Limite do porte:</span>
                          <p className="text-lg font-bold text-blue-600">{projectInfo.porteLimit} dias</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Status:</span>
                          <p className="text-lg font-bold">
                            {projectInfo.daysUsed > 0 ? (
                              projectInfo.isWithinLimit ? (
                                <span className="text-green-600">Dentro do prazo</span>
                              ) : (
                                <span className="text-red-600">Excedido</span>
                              )
                            ) : (
                              <span className="text-gray-500">Não calculado</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {projectInfo.daysUsed > 0 && !projectInfo.isWithinLimit && (
                        <div className="mt-3 text-xs text-red-600">
                          ⚠️ Excedeu o prazo permitido em {projectInfo.daysUsed - projectInfo.porteLimit} dias
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="data_fechamento"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Fechamento</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={(date) => field.onChange(date)}
                                disabled={(date) => date > new Date("2030-01-01") || date < new Date("2020-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
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
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={(date) => field.onChange(date)}
                                disabled={(date) => date > new Date("2030-01-01") || date < new Date("2020-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Informações Financeiras</h2>
                  <p className="text-sm text-muted-foreground">Dados financeiros do projeto</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      R$ {bonus8Percent}
                    </div>
                    <p className="text-xs text-muted-foreground">Valor calculado como 8% do valor da consultoria</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Bônus (12%)</div>
                    <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                      R$ {bonus12Percent}
                    </div>
                    <p className="text-xs text-muted-foreground">Valor calculado como 12% do valor da consultoria</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-6">
              <Button type="submit" disabled={isSaving} className="bg-[#0056D6] text-white hover:bg-[#0056D6]/90">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      )}
      <Toaster />
    </div>
  )
}
