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
import { getMembersByService, getAllMembers } from "@/lib/members-service"

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
  const [duration, setDuration] = useState(0)
  const [netProjectValue, setNetProjectValue] = useState(0)
  const [consultingValue, setConsultingValue] = useState(0)
  const [bonus8Percent, setBonus8Percent] = useState(0)
  const [bonus12Percent, setBonus12Percent] = useState(0)

  // Estado para erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Estado para consultores
  const [consultants, setConsultants] = useState<{ id: string; name: string }[]>([])

  // Definir os portes conforme solicitado - mantendo o formato original
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

  // Buscar consultores do sistema - CORRIGIDO
  useEffect(() => {
    async function fetchConsultants() {
      try {
        setIsLoadingConsultants(true)
        console.log("🔍 Iniciando busca de consultores...")

        let consultorsList: { id: string; name: string }[] = []

        // Estratégia 1: Buscar todos os membros
        console.log("📋 Tentativa 1: Buscando todos os membros...")
        const allMembers = await getAllMembers()
        console.log("👥 Todos os membros encontrados:", allMembers)

        if (allMembers && allMembers.length > 0) {
          consultorsList = allMembers.map((member) => ({
            id: member.id,
            name: member.name,
          }))
          console.log("✅ Usando todos os membros como consultores:", consultorsList)
        }

        // Estratégia 2: Se não encontrou membros, buscar por service_type
        if (consultorsList.length === 0) {
          console.log("📋 Tentativa 2: Buscando membros por service_type 'consultoria'...")
          const consultingMembers = await getMembersByService("consultoria")
          console.log("👨‍💼 Membros de consultoria encontrados:", consultingMembers)

          if (consultingMembers && consultingMembers.length > 0) {
            consultorsList = consultingMembers.map((member) => ({
              id: member.id,
              name: member.name,
            }))
            console.log("✅ Usando membros de consultoria:", consultorsList)
          }
        }

        // Estratégia 3: Buscar consultores da tabela de métricas
        if (consultorsList.length === 0) {
          console.log("📋 Tentativa 3: Buscando consultores da tabela de métricas...")
          const consultoresFromMetrics = await getConsultores()
          console.log("📊 Consultores das métricas:", consultoresFromMetrics)

          if (consultoresFromMetrics && consultoresFromMetrics.length > 0) {
            consultorsList = consultoresFromMetrics.map((name, index) => ({
              id: `consultant-${index}`,
              name,
            }))
            console.log("✅ Usando consultores das métricas:", consultorsList)
          }
        }

        // Estratégia 4: Lista padrão como último recurso
        if (consultorsList.length === 0) {
          console.log("⚠️ Nenhum consultor encontrado, usando lista padrão...")
          consultorsList = [
            { id: "1", name: "José Vogel" },
            { id: "2", name: "Maria Silva" },
            { id: "3", name: "Carlos Santos" },
            { id: "4", name: "Ana Costa" },
            { id: "5", name: "Pedro Oliveira" },
          ]
          console.log("📝 Lista padrão de consultores:", consultorsList)

          toast({
            title: "Aviso",
            description: "Usando lista padrão de consultores. Verifique se há membros cadastrados no sistema.",
            variant: "warning",
          })
        }

        setConsultants(consultorsList)
        console.log("🎯 Consultores finais definidos:", consultorsList)
      } catch (error) {
        console.error("❌ Erro ao buscar consultores:", error)

        // Lista de emergência
        const emergencyList = [
          { id: "1", name: "José Vogel" },
          { id: "2", name: "Maria Silva" },
          { id: "3", name: "Carlos Santos" },
          { id: "4", name: "Ana Costa" },
          { id: "5", name: "Pedro Oliveira" },
        ]

        setConsultants(emergencyList)
        console.log("🚨 Usando lista de emergência:", emergencyList)

        toast({
          title: "Erro",
          description: "Erro ao carregar consultores. Usando lista padrão.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingConsultants(false)
      }
    }

    fetchConsultants()
  }, [])

  // Usar useEffect para calcular os bônus automaticamente
  useEffect(() => {
    setBonus8Percent(consultingValue * 0.08)
    setBonus12Percent(consultingValue * 0.12)
  }, [consultingValue])

  // UseEffect para obter o limite de dias baseado no porte
  const getPorteLimit = (porteValue: string): number => {
    const porteLimits = {
      basic: 15,
      starter: 25,
      pro: 40,
      enterprise: 60,
    }
    return porteLimits[porteValue as keyof typeof porteLimits] || 0
  }

  // UseEffect para calcular a duração entre as datas
  useEffect(() => {
    if (startDate && endDate) {
      const timeDiff = endDate.getTime() - startDate.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
      setDuration(Math.max(0, daysDiff))
    } else {
      setDuration(0)
    }
  }, [startDate, endDate])

  // Função para calcular informações do projeto
  const calculateProjectInfo = () => {
    const porteLimit = getPorteLimit(size)
    const daysUsed = duration
    const isWithinLimit = daysUsed <= porteLimit && daysUsed > 0

    return {
      daysUsed,
      porteLimit,
      isWithinLimit,
    }
  }

  const projectInfo = calculateProjectInfo()

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
    if (netProjectValue <= 0) newErrors.netProjectValue = "Valor líquido deve ser maior que zero"

    // Validar se a data de término é posterior à data de início
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = "A data de término deve ser posterior à data de início"
    }

    // Validar se o porte está nos valores aceitos
    const validPortes = ["basic", "starter", "pro", "enterprise"]
    if (size && !validPortes.includes(size)) {
      newErrors.size = `Porte deve ser um dos valores: ${validPortes.join(", ")}`
    }

    // Validar se o tipo está nos valores aceitos
    const validTipos = ["Consultoria", "Upsell"]
    if (projectType && !validTipos.includes(projectType)) {
      newErrors.projectType = `Tipo deve ser um dos valores: ${validTipos.join(", ")}`
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

      // Validação adicional e normalização do porte
      const validPortes = ["basic", "starter", "pro", "enterprise"]
      const normalizedSize = size.trim().toLowerCase()

      if (!validPortes.includes(normalizedSize)) {
        throw new Error(`Porte inválido: "${size}". Valores aceitos: ${validPortes.join(", ")}`)
      }

      // Format dates to YYYY-MM-DD
      const formattedStartDate = startDate ? format(startDate, "yyyy-MM-dd") : ""
      const formattedEndDate = endDate ? format(endDate, "yyyy-MM-dd") : ""

      // Encontrar o nome do consultor pelo ID
      const consultant = consultants.find((c) => c.id === memberId)
      const consultorName = consultant ? consultant.name : ""

      console.log("📝 Dados do formulário antes do envio:", {
        consultant,
        consultorName,
        memberId,
        consultants,
        size: normalizedSize,
        projectType,
        porteValido: validPortes.includes(normalizedSize),
        tipoValido: ["Consultoria", "Upsell"].includes(projectType),
        dadosCompletos: {
          cliente: client,
          tipo: projectType,
          consultor: consultorName,
          porte: normalizedSize,
          status: status,
        },
      })

      const result = await createConsultingMetric({
        date: new Date().toISOString().split("T")[0], // Data atual
        member_id: "", // Removido o member_id, pois não existe na tabela
        consultor: consultorName,
        client: client,
        project_type: projectType,
        status: status,
        size: normalizedSize, // Usar valor normalizado
        size_detail: sizeDetail || "",
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        duration: duration,
        consulting_value: consultingValue,
        bonus_8_percent: bonus8Percent,
        bonus_12_percent: bonus12Percent,
        valor_liquido_projeto: netProjectValue,
      })

      if (result.success) {
        toast({
          title: "Projeto cadastrado com sucesso",
          description: `O projeto de consultoria foi cadastrado para ${consultorName}.`,
        })

        // Redirect to dashboard
        router.push("/dashboard/consultoria/graficos")
      } else {
        throw new Error(result.error || "Erro ao cadastrar projeto")
      }
    } catch (error) {
      console.error("Erro ao cadastrar projeto:", error)

      // Melhor tratamento de erro para identificar o problema específico
      let errorMessage = "Ocorreu um erro ao tentar cadastrar o projeto"

      if (error instanceof Error) {
        if (error.message.includes("tipo_check") || error.message.includes("check constraint")) {
          errorMessage = `❌ Erro de restrição no banco de dados. 
          
🔧 Execute os scripts SQL na seguinte ordem:
1. debug-tipo-constraint.sql (para ver o problema)
2. fix-tipo-constraint.sql (para corrigir)

Valor enviado para tipo: "${projectType}"`
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Erro ao cadastrar projeto",
        description: errorMessage,
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
          form="consulting-form"
          type="submit"
          disabled={isLoading}
          className="bg-white text-[#0056D6] hover:bg-white/90"
        >
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Salvando..." : "Cadastrar Projeto"}
        </Button>
      </div>

      <form id="consulting-form" onSubmit={handleSubmit} className="space-y-6">
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
                    {tipos.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.projectType && <p className="text-sm text-red-500">{errors.projectType}</p>}
                <div className="text-xs text-muted-foreground"></div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Consultor {isLoadingConsultants && <span className="text-xs">(Carregando...)</span>}
                </label>
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

              <div className="md:col-span-2 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">Informações do Projeto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Dias utilizados:</span>
                      <p
                        className={`text-lg font-bold ${projectInfo.isWithinLimit ? "text-green-600" : "text-red-600"}`}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Informações Financeiras</h2>
              <p className="text-sm text-muted-foreground">Dados financeiros do projeto</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <label className="text-sm font-medium">Bônus (12%)</label>
                <Input type="text" value={`R$ ${bonus12Percent.toFixed(2)}`} disabled />
                <p className="text-xs text-muted-foreground">Valor calculado como 12% do valor da consultoria</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={isLoading} className="bg-[#0056D6] text-white hover:bg-[#0056D6]/90">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Salvando..." : "Cadastrar Projeto"}
          </Button>
        </div>
      </form>
    </div>
  )
}
