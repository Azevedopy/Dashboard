"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { createConsultingMetric, getConsultores } from "@/lib/consulting-service"
import { getMembersByService } from "@/lib/members-service"

export default function ConsultingMetricsForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(true)

  // Estados para os campos do formulário
  const [client, setClient] = useState("")
  const [projectType, setProjectType] = useState("")
  const [memberId, setMemberId] = useState("")
  const [status, setStatus] = useState("")
  const [size, setSize] = useState("")
  const [sizeDetail, setSizeDetail] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [duration, setDuration] = useState(15)
  const [closingDate, setClosingDate] = useState<Date | undefined>(undefined)
  const [turningDate, setTurningDate] = useState<Date | undefined>(undefined)
  const [consultingValue, setConsultingValue] = useState(0)
  const [bonus8Percent, setBonus8Percent] = useState(0)
  const [bonus12Percent, setBonus12Percent] = useState(0)

  // Estado para erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Estado para consultores
  const [consultants, setConsultants] = useState<{ id: string; name: string }[]>([])

  // Definir os portes conforme a estrutura existente
  const portes = [
    { value: "basic", label: "Basic" },
    { value: "starter", label: "Starter" },
    { value: "pro", label: "Pro" },
    { value: "enterprise", label: "Enterprise" },
  ]

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

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!client) newErrors.client = "Cliente é obrigatório"
    if (!projectType) newErrors.projectType = "Tipo é obrigatório"
    if (!memberId) newErrors.memberId = "Consultor é obrigatório"
    if (!status) newErrors.status = "Status é obrigatório"
    if (!size) newErrors.size = "Porte é obrigatório"
    if (!startDate) newErrors.startDate = "Data de início é obrigatória"
    if (!endDate) newErrors.endDate = "Data de término é obrigatória"
    if (duration <= 0) newErrors.duration = "Duração deve ser maior que 0"

    // Validar se a data de término é posterior à data de início
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = "A data de término deve ser posterior à data de início"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário antes de enviar.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Format dates to YYYY-MM-DD
      const formattedStartDate = startDate ? format(startDate, "yyyy-MM-dd") : ""
      const formattedEndDate = endDate ? format(endDate, "yyyy-MM-dd") : ""
      const formattedClosingDate = closingDate ? format(closingDate, "yyyy-MM-dd") : null
      const formattedTurningDate = turningDate ? format(turningDate, "yyyy-MM-dd") : null

      // Encontrar o nome do consultor pelo ID
      const consultant = consultants.find((c) => c.id === memberId)
      const consultorName = consultant ? consultant.name : ""

      const result = await createConsultingMetric({
        date: new Date().toISOString().split("T")[0], // Data atual
        member_id: "", // Removido o member_id, pois não existe na tabela
        consultor: consultorName,
        client: client,
        project_type: projectType,
        status: status,
        size: size,
        size_detail: sizeDetail || "",
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        duration: duration,
        closing_date: formattedClosingDate,
        turning_date: formattedTurningDate,
        consulting_value: consultingValue,
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
      <div className="p-6 bg-[#0056D6] text-white flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Cadastrar Projeto</h1>
            <p className="text-sm text-white/90">Adicione as informações do projeto de consultoria</p>
          </div>
        </div>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-white text-[#0056D6] hover:bg-white/90"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Informações Básicas</h2>
              <p className="text-sm text-muted-foreground">Dados principais do projeto</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <Input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className={errors.client ? "border-red-500" : ""}
                />
                {errors.client && <p className="text-sm text-red-500">{errors.client}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select onValueChange={setProjectType}>
                  <SelectTrigger className={errors.projectType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultoria">Consultoria</SelectItem>
                    <SelectItem value="upsell">Upsell</SelectItem>
                  </SelectContent>
                </Select>
                {errors.projectType && <p className="text-sm text-red-500">{errors.projectType}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Consultor</label>
                <Select onValueChange={setMemberId} disabled={isLoadingConsultants}>
                  <SelectTrigger className={errors.memberId ? "border-red-500" : ""}>
                    <SelectValue
                      placeholder={isLoadingConsultants ? "Carregando consultores..." : "Selecione um consultor"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {consultants.map((consultant) => (
                      <SelectItem key={consultant.id} value={consultant.id}>
                        {consultant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.memberId && <p className="text-sm text-red-500">{errors.memberId}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select onValueChange={setStatus}>
                  <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Porte</label>
                <Select onValueChange={setSize}>
                  <SelectTrigger className={errors.size ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o porte" />
                  </SelectTrigger>
                  <SelectContent>
                    {portes.map((porte) => (
                      <SelectItem key={porte.value} value={porte.value}>
                        {porte.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.size && <p className="text-sm text-red-500">{errors.size}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Porte Detalhado</label>
                <Input
                  value={sizeDetail}
                  onChange={(e) => setSizeDetail(e.target.value)}
                  placeholder="Detalhes adicionais sobre o porte"
                />
              </div>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !startDate && "text-muted-foreground",
                        errors.startDate && "border-red-500",
                      )}
                    >
                      {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date > new Date("2030-01-01") || date < new Date("2020-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Término</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !endDate && "text-muted-foreground",
                        errors.endDate && "border-red-500",
                      )}
                    >
                      {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date > new Date("2030-01-01") || date < new Date("2020-01-01")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Duração (dias)</label>
                <Input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(Number.parseInt(e.target.value) || 0)}
                  className={errors.duration ? "border-red-500" : ""}
                />
                {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Fechamento</label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Virada</label>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor da Consultoria (R$)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={consultingValue}
                  onChange={(e) => setConsultingValue(Number.parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bônus (8%)</label>
                <Input type="text" value={`R$ ${bonus8Percent.toFixed(2)}`} disabled />
                <p className="text-xs text-muted-foreground">Valor calculado como 8% do valor da consultoria</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bônus (12%)</label>
                <Input type="text" value={`R$ ${bonus12Percent.toFixed(2)}`} disabled />
                <p className="text-xs text-muted-foreground">Valor calculado como 12% do valor da consultoria</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
