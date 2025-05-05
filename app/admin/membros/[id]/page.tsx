"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, Calendar, Briefcase, Shield, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getMemberById, getMemberMetrics } from "@/lib/members-service"
import { MetricsTable } from "@/components/dashboard/metrics-table"
import type { Member, MetricEntry } from "@/lib/types"

export default function MemberDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [member, setMember] = useState<Member | null>(null)
  const [metrics, setMetrics] = useState<MetricEntry[]>([])
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchMember(params.id as string)
    }
  }, [params.id])

  const fetchMember = async (id: string) => {
    setIsLoading(true)
    try {
      const data = await getMemberById(id)
      if (data) {
        setMember(data)
        fetchMemberMetrics(id)
      } else {
        toast({
          title: "Membro não encontrado",
          description: "O membro solicitado não foi encontrado.",
          variant: "destructive",
        })
        router.push("/admin/membros")
      }
    } catch (error) {
      console.error("Error fetching member:", error)
      toast({
        title: "Erro ao carregar membro",
        description: "Não foi possível carregar os dados do membro. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMemberMetrics = async (id: string) => {
    setIsLoadingMetrics(true)
    try {
      // Buscar métricas dos últimos 30 dias
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const startDate = thirtyDaysAgo.toISOString().split("T")[0]

      const data = await getMemberMetrics(id, startDate)
      setMetrics(data)
    } catch (error) {
      console.error("Error fetching member metrics:", error)
      toast({
        title: "Erro ao carregar métricas",
        description: "Não foi possível carregar as métricas do membro. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMetrics(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detalhes do Membro</h1>
          <p className="text-sm text-muted-foreground">Visualize informações detalhadas do membro</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        ) : member ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <Avatar className="h-24 w-24 text-2xl">
                <AvatarImage src={member.avatar_url || ""} alt={member.name} />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <p className="text-muted-foreground">{member.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <a href={`mailto:${member.email}`}>
                      <Mail className="h-4 w-4" />
                      Enviar Email
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => router.push(`/admin/membros/edit/${member.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Dados básicos do membro</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nome Completo</p>
                      <p className="font-medium">{member.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Entrada</p>
                      <p className="font-medium">{formatDate(member.joined_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações Profissionais</CardTitle>
                  <CardDescription>Dados profissionais do membro</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Função</p>
                      <p className="font-medium">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Acesso</p>
                      <p className="font-medium">{member.access_type || "member"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="metrics">
              <TabsList>
                <TabsTrigger value="metrics">Métricas Recentes</TabsTrigger>
              </TabsList>
              <TabsContent value="metrics" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas dos Últimos 30 Dias</CardTitle>
                    <CardDescription>Desempenho recente do membro</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MetricsTable metrics={metrics} isLoading={isLoadingMetrics} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Membro não encontrado</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/membros")}>
              Voltar para Lista de Membros
            </Button>
          </div>
        )}
      </div>

      <Toaster />
    </div>
  )
}
