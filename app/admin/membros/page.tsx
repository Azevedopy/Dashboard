"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit, Trash2, Save, Search, UserPlus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getMembers, createMember, updateMember, deleteMember, isEmailInUse } from "@/lib/members-service"
import type { Member } from "@/lib/types"

// Schema para validação do formulário
const memberSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.string().min(1, "Função é obrigatória"),
  avatar_url: z.string().optional(),
  access_type: z.string().default("member"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
})

type MemberFormValues = z.infer<typeof memberSchema>

export default function MembersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      avatar_url: "",
      access_type: "member",
      password: "",
    },
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.role.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredMembers(filtered)
    } else {
      setFilteredMembers(members)
    }
  }, [searchTerm, members])

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const data = await getMembers()
      setMembers(data)
      setFilteredMembers(data)
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

  const handleAddMember = () => {
    setEditingMember(null)
    form.reset({
      name: "",
      email: "",
      role: "",
      avatar_url: "",
      access_type: "member",
      password: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    form.reset({
      name: member.name,
      email: member.email,
      role: member.role,
      avatar_url: member.avatar_url || "",
      access_type: member.access_type || "member",
      password: "", // Não preencher a senha ao editar
    })
    setIsDialogOpen(true)
  }

  const handleDeleteMember = async (member: Member) => {
    if (confirm(`Tem certeza que deseja excluir o membro ${member.name}?`)) {
      try {
        const success = await deleteMember(member.id)
        if (success) {
          toast({
            title: "Membro excluído",
            description: `O membro ${member.name} foi excluído com sucesso.`,
          })
          fetchMembers()
        } else {
          throw new Error("Falha ao excluir membro")
        }
      } catch (error) {
        console.error("Error deleting member:", error)
        toast({
          title: "Erro ao excluir membro",
          description: "Não foi possível excluir o membro. Tente novamente mais tarde.",
          variant: "destructive",
        })
      }
    }
  }

  const onSubmit = async (data: MemberFormValues) => {
    setIsSubmitting(true)
    try {
      // Verificar se o email já está em uso
      const emailInUse = await isEmailInUse(data.email, editingMember?.id)
      if (emailInUse) {
        form.setError("email", {
          type: "manual",
          message: "Este email já está em uso",
        })
        setIsSubmitting(false)
        return
      }

      if (editingMember) {
        // Atualizar membro existente
        const memberData = { ...data }
        if (!memberData.password) {
          delete memberData.password // Remover senha se estiver vazia
        }

        const result = await updateMember(editingMember.id, memberData)
        if (result) {
          toast({
            title: "Membro atualizado",
            description: `O membro ${data.name} foi atualizado com sucesso.`,
          })
          setIsDialogOpen(false)
          fetchMembers()
        } else {
          throw new Error("Falha ao atualizar membro")
        }
      } else {
        // Criar novo membro
        if (!data.password) {
          form.setError("password", {
            type: "manual",
            message: "Senha é obrigatória para novos membros",
          })
          setIsSubmitting(false)
          return
        }

        const result = await createMember(data)
        if (result) {
          toast({
            title: "Membro criado",
            description: `O membro ${data.name} foi criado com sucesso.`,
          })
          setIsDialogOpen(false)
          fetchMembers()
        } else {
          throw new Error("Falha ao criar membro")
        }
      }
    } catch (error) {
      console.error("Error saving member:", error)
      toast({
        title: "Erro ao salvar membro",
        description: "Não foi possível salvar o membro. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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

  const roleOptions = [
    { value: "suporte", label: "Suporte" },
    { value: "consultoria", label: "Consultoria" },
    { value: "genier", label: "Genier" },
    { value: "admin", label: "Administrador" },
  ]

  const accessTypeOptions = [
    { value: "member", label: "Membro" },
    { value: "admin", label: "Administrador" },
    { value: "manager", label: "Gerente" },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Gerenciamento de Membros</h1>
        <p className="text-sm text-muted-foreground">Gerencie os membros da equipe</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchMembers} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={handleAddMember} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Adicionar Membro
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Membros</CardTitle>
            <CardDescription>Membros cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Tipo de Acesso</TableHead>
                      <TableHead>Data de Entrada</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.avatar_url || ""} alt={member.name} />
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{member.access_type || "member"}</TableCell>
                        <TableCell>
                          {new Date(member.joined_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)} title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMember(member)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum membro encontrado</p>
                <Button variant="outline" className="mt-4" onClick={handleAddMember}>
                  Adicionar Membro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Editar Membro" : "Adicionar Membro"}</DialogTitle>
            <DialogDescription>
              {editingMember
                ? `Edite as informações de ${editingMember.name}`
                : "Preencha as informações para adicionar um novo membro"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Nome completo" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@exemplo.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select defaultValue={form.getValues("role")} onValueChange={(value) => form.setValue("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_type">Tipo de Acesso</Label>
              <Select
                defaultValue={form.getValues("access_type")}
                onValueChange={(value) => form.setValue("access_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo de acesso" />
                </SelectTrigger>
                <SelectContent>
                  {accessTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">URL do Avatar</Label>
              <Input id="avatar_url" placeholder="https://exemplo.com/avatar.jpg" {...form.register("avatar_url")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {editingMember ? "Nova Senha (deixe em branco para manter a atual)" : "Senha"}
              </Label>
              <Input id="password" type="password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
