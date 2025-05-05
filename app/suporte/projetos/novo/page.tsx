"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Save, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { createSupportProject } from "@/lib/support-service"
import { useToast } from "@/components/ui/use-toast"

export default function NovoProjetoSuportePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    cliente: "",
    tipo: "",
    data_inicio: "",
    data_termino: "",
    tempo_dias: 0,
    porte: "",
    porte_detalhado: "",
    valor_consultoria: 0,
    valor_bonus: 0,
    consultor: "",
    status: "em_andamento",
    prazo_atingido: false,
  })
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  const handleStartDateSelect = (date: Date) => {
    setStartDate(date)
    setFormData({
      ...formData,
      data_inicio: format(date, "yyyy-MM-dd"),
    })

    // Calcular tempo_dias se ambas as datas estiverem definidas
    if (endDate) {
      const diffTime = Math.abs(endDate.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setFormData((prev) => ({
        ...prev,
        tempo_dias: diffDays,
      }))
    }
  }

  const handleEndDateSelect = (date: Date) => {
    setEndDate(date)
    setFormData({
      ...formData,
      data_termino: format(date, "yyyy-MM-dd"),
    })

    // Calcular tempo_dias se ambas as datas estiverem definidas
    if (startDate) {
      const diffTime = Math.abs(date.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setFormData((prev) => ({
        ...prev,
        tempo_dias: diffDays,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validação básica
    if (!formData.cliente || !formData.tipo) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha pelo menos o cliente e o tipo do projeto.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createSupportProject(formData)

      if (result) {
        toast({
          title: "Sucesso",
          description: "Projeto criado com sucesso!",
        })
        router.push("/suporte/projetos")
      } else {
        throw new Error("Não foi possível criar o projeto.")
      }
    } catch (error) {
      console.error("Erro ao criar projeto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o projeto. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Novo Projeto de Suporte</h1>
            <p className="text-sm text-muted-foreground">Cadastre um novo projeto de suporte</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Projeto</CardTitle>
              <CardDescription>Preencha os dados do novo projeto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    placeholder="Nome do cliente"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Projeto</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Implementação">Implementação</SelectItem>
                      <SelectItem value="Consultoria">Consultoria</SelectItem>
                      <SelectItem value="Treinamento">Treinamento</SelectItem>
                      <SelectItem value="Suporte">Suporte</SelectItem>
                      <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal" id="data_inicio">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={handleStartDateSelect}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_termino">Data de Término</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        id="data_termino"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={handleEndDateSelect}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempo_dias">Tempo (dias)</Label>
                  <Input
                    id="tempo_dias"
                    type="number"
                    min="1"
                    value={formData.tempo_dias}
                    onChange={(e) => setFormData({ ...formData, tempo_dias: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="porte">Porte do Projeto</Label>
                  <Select value={formData.porte} onValueChange={(value) => setFormData({ ...formData, porte: value })}>
                    <SelectTrigger id="porte">
                      <SelectValue placeholder="Selecione o porte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pequeno">Pequeno</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="porte_detalhado">Detalhes do Porte</Label>
                  <Input
                    id="porte_detalhado"
                    placeholder="Detalhes adicionais sobre o porte"
                    value={formData.porte_detalhado}
                    onChange={(e) => setFormData({ ...formData, porte_detalhado: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultor">Consultor</Label>
                  <Input
                    id="consultor"
                    placeholder="Nome do consultor responsável"
                    value={formData.consultor}
                    onChange={(e) => setFormData({ ...formData, consultor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="atrasado">Atrasado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="valor_consultoria">Valor da Consultoria (R$)</Label>
                  <Input
                    id="valor_consultoria"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_consultoria}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_consultoria: Number.parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_bonus">Valor do Bônus (R$)</Label>
                  <Input
                    id="valor_bonus"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor_bonus}
                    onChange={(e) => setFormData({ ...formData, valor_bonus: Number.parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="prazo_atingido"
                  checked={formData.prazo_atingido}
                  onCheckedChange={(checked) => setFormData({ ...formData, prazo_atingido: checked })}
                />
                <Label htmlFor="prazo_atingido">Prazo Atingido</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                  {!isSubmitting && <Save className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
