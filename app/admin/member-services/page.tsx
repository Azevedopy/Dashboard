"use client"

import { useState, useEffect } from "react"
import { getMembers } from "@/lib/data-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function MemberServicesPage() {
  const router = useRouter()
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchMembers() {
      setIsLoading(true)
      try {
        const data = await getMembers()
        setMembers(data)
      } catch (error) {
        console.error("Error fetching members:", error)
        toast({
          title: "Erro ao carregar membros",
          description: "Não foi possível carregar a lista de membros.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [])

  const handleMemberChange = (memberId) => {
    setSelectedMember(memberId)
    const member = members.find((m) => m.id === memberId)
    setSelectedService(member?.service_type || "")
  }

  const handleSubmit = async () => {
    if (!selectedMember || !selectedService) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um membro e um tipo de serviço.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/update-member-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: selectedMember,
          serviceType: selectedService,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao atualizar o tipo de serviço")
      }

      const result = await response.json()

      // Atualizar o membro na lista local
      setMembers((prevMembers) =>
        prevMembers.map((member) =>
          member.id === selectedMember ? { ...member, service_type: selectedService } : member,
        ),
      )

      toast({
        title: "Tipo de serviço atualizado",
        description: "O tipo de serviço do membro foi atualizado com sucesso.",
      })
    } catch (error) {
      console.error("Error updating member service:", error)
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar o tipo de serviço.",
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
          <h1 className="text-2xl font-bold">Gerenciar Tipos de Serviço</h1>
          <p className="text-sm text-muted-foreground">Atribuir membros a tipos de serviço específicos</p>
        </div>
      </div>

      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Atribuir Tipo de Serviço</CardTitle>
            <CardDescription>
              Selecione um membro e atribua um tipo de serviço (suporte, consultoria, genier, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Carregando membros...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Membro</label>
                    <Select value={selectedMember} onValueChange={handleMemberChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um membro" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} {member.service_type ? `(${member.service_type})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Serviço</label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo de serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="suporte">Suporte</SelectItem>
                        <SelectItem value="consultoria">Consultoria</SelectItem>
                        <SelectItem value="genier">Genier</SelectItem>
                        <SelectItem value="admin">Administração</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedMember || !selectedService}
                  className="w-full"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </Button>

                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Membros por Tipo de Serviço</h3>
                  <div className="space-y-4">
                    {["suporte", "consultoria", "genier", "admin", "outro"].map((serviceType) => {
                      const serviceMembers = members.filter((m) => m.service_type === serviceType)
                      return (
                        <div key={serviceType} className="border rounded-md p-3">
                          <h4 className="font-medium capitalize mb-2">{serviceType}</h4>
                          {serviceMembers.length > 0 ? (
                            <ul className="space-y-1">
                              {serviceMembers.map((member) => (
                                <li key={member.id} className="text-sm">
                                  {member.name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">Nenhum membro atribuído</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
