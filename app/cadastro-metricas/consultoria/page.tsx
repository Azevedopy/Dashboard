"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { createConsultingMetric, getConsultores } from "@/lib/consulting-service"
import { getMembersByService } from "@/lib/members-service"

// Simplificando o esquema Zod para evitar problemas com datas opcionais
const formSchema = z.object({
  client: z.string().min(1, "Cliente é obrigatório"),
  project_type: z.string().min(1, "Tipo é obrigatório"),
  member_id: z.string().min(1, "Consultor é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
  size: z.string().min(1, "Porte é obrigatório"),
  size_detail: z.string().optional(),
  start_date: z.date({
    required_error: "Data de início é obrigatória",
  }),
  end_date: z.date({
    required_error: "Data de término é obrigatória",
  }),
  duration: z.coerce.number().min(1, "Duração deve ser maior que 0"),
  consulting_value: z.coerce.number().min(0, "Valor deve ser maior ou igual a 0"),
})

export default function ConsultingMetricsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [bonus8Percent, setBonus8Percent] = useState(0)
  const [bonus12Percent, setBonus12Percent] = useState(0)
  const [closingDate, setClosingDate] = useState<Date | undefined>(undefined)
  const [turningDate, setTurningDate] = useState<Date | undefined>(undefined)
  const [consultants, setConsultants] = useState<{ id: string; name: string }[]>([])
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(true)
  const [consultingValue, setConsultingValue] = useState(0)

  const router = useRouter()

  // Definir os portes conforme a estrutura existente
  const portes = [
    { value: "basic", label: "Basic" },
    { value: "standard", label: "Standard" },
    { value: "premium", label: "Premium" },
    { value: "enterprise", label: "Enterprise" },
    { value: "custom", label: "Custom" },
  ]

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client: "",
      project_type: "",
      member_id: "",
      status: "",
      size: "",
      size_detail: "",
      consulting_value: 0,
      duration: 15,
    },
  })

  // Buscar consultores do sistema
  useEffect(() => {
    async function fetchConsultants() {
      try {
        setIsLoadingConsultants(true)

        // Agora podemos usar getMembersByService já que a coluna service_type existe
        const members = await getMembersByService("consultoria")

        if (members && members.length > 0) {
          console.log("Consultores encontrados pelo service_type:", members)
          setConsultants(
            members.map((member) => ({
              id: member.id,
              name: member.name,
            })),
          )
        } else {
          // Fallback: buscar consultores da tabela de métricas
          const consultores = await getConsultores()
          console.log("Consultores encontrados pelo getConsultores:", consultores)

          if (consultores && consultores.length > 0) {
            setConsultants(
              consultores.map((name, index) => ({
                id: `consultant-${index}`,
                name,
              })),
            )
          } else {
            // Dados de exemplo como último recurso
            setConsultants([
              { id: "1", name: "José Vogel" },
              { id: "2", name: "Maria Silva" },
              { id: "3", name: "Carlos Santos" },
            ])
          }
        }
      } catch (error) {
        console.error("Erro ao buscar consultores:", error)
        // Dados de exemplo em caso de erro
        setConsultants([
          { id: "1", name: "José Vogel" },
          { id: "2", name: "Maria Silva" },
          { id: "3", name: "Carlos Santos" },
        ])

        toast({
          title: "Aviso",
          description: "Usando lista padrão de consultores devido a um erro ao carregar dados.",
          variant: "warning",
        })
      } finally {
        setIsLoadingConsultants(false)
      }
    }

    fetchConsultants()
  }, [])

  // Usar useEffect para calcular os bônus quando o valor da consultoria mudar
  useEffect(() => {
    setBonus8Percent(consultingValue * 0.08)
    setBonus12Percent(consultingValue * 0.12)
  }, [consultingValue])

  // Função para lidar com a mudança no valor da consultoria
  const handleConsultingValueChange = (value: number) => {
    setConsultingValue(value)
    form.setValue("consulting_value", value)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      console.log("Valores do formulário:", values)

      // Format dates to YYYY-MM-DD
      const formattedStartDate = format(values.start_date, "yyyy-MM-dd")
      const formattedEndDate = format(values.end_date, "yyyy-MM-dd")
      const formattedClosingDate = closingDate ? format(closingDate, "yyyy-MM-dd") : null
      const formattedTurningDate = turningDate ? format(turningDate, "yyyy-MM-dd") : null

      // Encontrar o nome do consultor pelo ID
      const consultant = consultants.find((c) => c.id === values.member_id)
      const consultorName = consultant ? consultant.name : ""

      const result = await createConsultingMetric({
        date: new Date().toISOString().split("T")[0], // Data atual
        member_id: values.member_id,
        consultor: consultorName, // Adicionar o nome do consultor
        client: values.client,
        project_type: values.project_type,
        status: values.status,
        size: values.size,
        size_detail: values.size_detail || "",
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        duration: values.duration,
        closing_date: formattedClosingDate,
        turning_date: formattedTurningDate,
        consulting_value: values.consulting_value,
        bonus_8_percent: bonus8Percent,
        bonus_12_percent: bonus12Percent,
      })

      if (result.success) {
        toast({
          title: "Projeto cadastrado com sucesso",
          description: `O projeto de consultoria foi cadastrado.`,
        })

        // Redirect to dashboard
        router.push("/dashboard/consultoria/graficos")
      } else {
        throw new Error(result.error || "Erro ao cadastrar projeto")
      }
    } catch (error) {
      console.error("Erro ao cadastrar projeto:", error)
      toast({
        title: "Erro ao cadastrar projeto",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar cadastrar o projeto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cadastrar Projeto</h1>
            <p className="text-sm text-muted-foreground">Adicione as informações do projeto de consultoria</p>
          </div>
        </div>
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Informações Básicas</h2>
                <p className="text-sm text-muted-foreground">Dados principais do projeto</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="project_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consultoria">Consultoria</SelectItem>
                          <SelectItem value="upsell">Upsell</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="member_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultor</FormLabel>
                      <Select onValueChange={field.onChange} disabled={isLoadingConsultants}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingConsultants ? "Carregando consultores..." : "Selecione um consultor"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {consultants.map((consultant) => (
                            <SelectItem key={consultant.id} value={consultant.id}>
                              {consultant.name}
                            </SelectItem>
                          ))}
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
                      <Select onValueChange={field.onChange}>
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
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porte</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
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
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size_detail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porte Detalhado</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Detalhes adicionais sobre o porte" />
                      </FormControl>
                      <FormMessage />
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
                  name="start_date"
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
                            onSelect={field.onChange}
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
                  name="end_date"
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
                            onSelect={field.onChange}
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
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (dias)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2">Data de Fechamento</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !closingDate && "text-muted-foreground")}
                      >
                        {closingDate ? (
                          format(closingDate, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={closingDate}
                        onSelect={setClosingDate}
                        disabled={(date) => date > new Date("2030-01-01") || date < new Date("2020-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2">Data de Virada</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !turningDate && "text-muted-foreground")}
                      >
                        {turningDate ? (
                          format(turningDate, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={turningDate}
                        onSelect={setTurningDate}
                        disabled={(date) => date > new Date("2030-01-01") || date < new Date("2020-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium">Valor da Consultoria (R$)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={consultingValue}
                    onChange={(e) => handleConsultingValueChange(Number.parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Bônus (8%)</label>
                  <Input type="text" value={`R$ ${bonus8Percent.toFixed(2)}`} disabled />
                  <p className="text-xs text-muted-foreground mt-1">Valor calculado como 8% do valor da consultoria</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Bônus (12%)</label>
                  <Input type="text" value={`R$ ${bonus12Percent.toFixed(2)}`} disabled />
                  <p className="text-xs text-muted-foreground mt-1">Valor calculado como 12% do valor da consultoria</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
