"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusCircle, Edit, Trash2, Save, Plus, Minus } from "lucide-react"

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
import { getDefaultPermissions, upsertDefaultPermission, deleteDefaultPermission } from "@/lib/permissions-service"
import type { DefaultPermission } from "@/lib/types"

// Schema para validação do formulário
const permissionSchema = z.object({
  role_type: z.string().min(1, "Tipo de função é obrigatório"),
  permissions: z.array(
    z.object({
      resource: z.string().min(1, "Recurso é obrigatório"),
      actions: z.array(z.string()),
    }),
  ),
})

type PermissionFormValues = z.infer<typeof permissionSchema>

export default function PermissionsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState<DefaultPermission[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<DefaultPermission | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      role_type: "",
      permissions: [{ resource: "", actions: [] }],
    },
  })

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    setIsLoading(true)
    try {
      const data = await getDefaultPermissions()
      setPermissions(data)
    } catch (error) {
      console.error("Error fetching permissions:", error)
      toast({
        title: "Erro ao carregar permissões",
        description: "Não foi possível carregar as permissões. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPermission = () => {
    setEditingPermission(null)
    form.reset({
      role_type: "",
      permissions: [{ resource: "", actions: [] }],
    })
    setIsDialogOpen(true)
  }

  const handleEditPermission = (permission: DefaultPermission) => {
    setEditingPermission(permission)
    form.reset({
      role_type: permission.role_type,
      permissions: permission.permissions,
    })
    setIsDialogOpen(true)
  }

  const handleDeletePermission = async (permission: DefaultPermission) => {
    if (confirm(`Tem certeza que deseja excluir as permissões para ${permission.role_type}?`)) {
      try {
        const success = await deleteDefaultPermission(permission.id)
        if (success) {
          toast({
            title: "Permissão excluída",
            description: `As permissões para ${permission.role_type} foram excluídas com sucesso.`,
          })
          fetchPermissions()
        } else {
          throw new Error("Falha ao excluir permissão")
        }
      } catch (error) {
        console.error("Error deleting permission:", error)
        toast({
          title: "Erro ao excluir permissão",
          description: "Não foi possível excluir a permissão. Tente novamente mais tarde.",
          variant: "destructive",
        })
      }
    }
  }

  const onSubmit = async (data: PermissionFormValues) => {
    setIsSubmitting(true)
    try {
      const permissionData = {
        ...(editingPermission?.id ? { id: editingPermission.id } : {}),
        role_type: data.role_type,
        permissions: data.permissions,
      }

      const result = await upsertDefaultPermission(permissionData as any)
      if (result) {
        toast({
          title: "Permissão salva",
          description: `As permissões para ${data.role_type} foram salvas com sucesso.`,
        })
        setIsDialogOpen(false)
        fetchPermissions()
      } else {
        throw new Error("Falha ao salvar permissão")
      }
    } catch (error) {
      console.error("Error saving permission:", error)
      toast({
        title: "Erro ao salvar permissão",
        description: "Não foi possível salvar a permissão. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addPermissionItem = () => {
    const currentPermissions = form.getValues("permissions")
    form.setValue("permissions", [...currentPermissions, { resource: "", actions: [] }])
  }

  const removePermissionItem = (index: number) => {
    const currentPermissions = form.getValues("permissions")
    if (currentPermissions.length > 1) {
      form.setValue(
        "permissions",
        currentPermissions.filter((_, i) => i !== index),
      )
    }
  }

  const addAction = (permissionIndex: number) => {
    const currentPermissions = form.getValues("permissions")
    const currentActions = currentPermissions[permissionIndex].actions
    form.setValue(`permissions.${permissionIndex}.actions`, [...currentActions, ""])
  }

  const removeAction = (permissionIndex: number, actionIndex: number) => {
    const currentPermissions = form.getValues("permissions")
    const currentActions = currentPermissions[permissionIndex].actions
    form.setValue(
      `permissions.${permissionIndex}.actions`,
      currentActions.filter((_, i) => i !== actionIndex),
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Gerenciamento de Permissões</h1>
        <p className="text-sm text-muted-foreground">Configure as permissões padrão para cada tipo de função</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Permissões Padrão</h2>
          <Button onClick={handleAddPermission} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Adicionar Permissão
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Permissões</CardTitle>
            <CardDescription>Permissões padrão configuradas para cada tipo de função</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
              </div>
            ) : permissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Função</TableHead>
                    <TableHead>Recursos</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">{permission.role_type}</TableCell>
                      <TableCell>
                        {permission.permissions.length > 0
                          ? permission.permissions.map((p) => p.resource).join(", ")
                          : "Nenhum recurso configurado"}
                      </TableCell>
                      <TableCell>
                        {new Date(permission.updated_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPermission(permission)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePermission(permission)}
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
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma permissão configurada</p>
                <Button variant="outline" className="mt-4" onClick={handleAddPermission}>
                  Adicionar Permissão
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPermission ? "Editar Permissão" : "Adicionar Permissão"}</DialogTitle>
            <DialogDescription>
              {editingPermission
                ? `Edite as permissões para ${editingPermission.role_type}`
                : "Configure as permissões para um novo tipo de função"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="role_type">Tipo de Função</Label>
                <Input
                  id="role_type"
                  placeholder="Ex: admin, user, editor"
                  {...form.register("role_type")}
                  disabled={!!editingPermission}
                />
                {form.formState.errors.role_type && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.role_type.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Permissões</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPermissionItem} className="gap-1">
                    <Plus className="h-3 w-3" />
                    Adicionar Recurso
                  </Button>
                </div>

                {form.watch("permissions").map((_, permissionIndex) => (
                  <Card key={permissionIndex}>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`permissions.${permissionIndex}.resource`}>Recurso</Label>
                            <Input
                              id={`permissions.${permissionIndex}.resource`}
                              placeholder="Ex: users, posts, comments"
                              {...form.register(`permissions.${permissionIndex}.resource`)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePermissionItem(permissionIndex)}
                            className="mt-6"
                            disabled={form.watch("permissions").length <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>

                        <div>
                          <div className="flex justify-between items-center">
                            <Label>Ações</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addAction(permissionIndex)}
                              className="gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Adicionar Ação
                            </Button>
                          </div>

                          <div className="space-y-2 mt-2">
                            {form.watch(`permissions.${permissionIndex}.actions`).map((_, actionIndex) => (
                              <div key={actionIndex} className="flex items-center gap-2">
                                <Input
                                  placeholder="Ex: read, write, delete"
                                  {...form.register(`permissions.${permissionIndex}.actions.${actionIndex}`)}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeAction(permissionIndex, actionIndex)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}

                            {form.watch(`permissions.${permissionIndex}.actions`).length === 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => addAction(permissionIndex)}
                              >
                                Adicionar Ação
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
