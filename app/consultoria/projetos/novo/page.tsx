"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { createConsultingProject } from "@/lib/consulting-service"

// Schema para validação do formulário
const projectSchema = z.object({
  cliente: z.string().min(1, { message: "Cliente é obrigatório" }),
  tipo: z.string().min(1, { message: "Tipo é obrigatório" }),
  tipo_projeto: z.string().min(1, { message: "Tipo de projeto é obrigatório" }),
  data_inicio: z.string().min(1, { message: "Data de início é obrigatória" }),
  data_termino: z.string().min(1, { message: "Data de término é obrigatória" }),
  tempo_dias: z.coerce.number().min(1, { message: "Tempo em dias deve ser maior que zero" }),
  porte: z.string().min(1, { message: "Porte é obrigatório" }),
  porte_detalhado: z.string().optional(),
  valor_consultoria: z.coerce.number().min(0, { message: "Valor deve ser maior ou igual a zero" }),
  valor_bonus: z.coerce.number().min(0, { message: "Valor de bônus deve ser maior ou igual a zero" }),
  consultor: z.string().optional(),
  status: z.string().default("em_andamento"),
  avaliacao: z.string().optional(),
})

type ProjectFormValues = z.infer<typeof projectSchema>

export default function NewConsultingProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      cliente: "",
      tipo: "consultoria",
      tipo_projeto: "",
      data_inicio: new Date().toISOString().split("T")[0],
      data_termino: "",
      tempo_dias: 30,
      porte: "",
      porte_detalhado: "",
      valor_consultoria: 0,
      valor_bonus: 0,
      consultor: "",
      status: "em_andamento",
      avaliacao: "",
    },
  })

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await createConsultingProject(data)
      if (result) {
        toast({
          title: "Projeto criado",
          description: `O projeto para ${data.cliente} foi criado com sucesso.`,
        })
        router.push("/consultoria/projetos")
      } else {
        throw new Error("Falha ao criar projeto")
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Erro ao criar projeto",
        description: "Não foi possível criar o projeto. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcular tempo em dias quando as datas mudam
  const calculateDays = () => {
    const startDate = form.getValues("data_inicio")
    const endDate = form.getValues("data_termino")

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      form.setValue("tempo_dias", diffDays)
    }
  }

  const tipoProjeto = [
    "Implantação",
    "Migração",
    "Consultoria Técnica",
    "Treinamento",
    "Desenvolvimento",
    "Suporte Avançado",
  ]

  const porteOptions = ["Basic", "Starter", "Pro", "Enterprise"]

  const statusOptions = [
    { value: "em_andamento", label: "Em Andamento" },
    { value: "concluido", label: "Concluído" },
    { value: "cancelado", label: "Cancelado" },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Projeto de Consultoria</h1>
          <p className="text-sm text-muted-foreground">Cadastre um novo projeto de consultoria</p>
        </div>
      </div>

      <div className="p-6 overflow-auto">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Dados do Projeto</CardTitle>
            <CardDescription>Preencha os dados do novo projeto de consultoria</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um tipo" />
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
                    name="tipo_projeto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Projeto</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um tipo de projeto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tipoProjeto.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
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
                    name="data_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              calculateDays()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_termino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              calculateDays()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tempo_dias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo em Dias</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um porte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {porteOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
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
                    name="porte_detalhado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porte Detalhado (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                    name="valor_consultoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Consultoria (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valor_bonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor de Bônus (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="avaliacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avaliação (opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Salvando..." : "Salvar Projeto"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
