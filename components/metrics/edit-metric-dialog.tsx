"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { updateMetric, deleteMetric } from "@/lib/data-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Schema para validação do formulário
const metricFormSchema = z.object({
  resolution_rate: z.coerce.number().min(0).max(100, { message: "Valor deve estar entre 0 e 100" }),
  average_response_time: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  csat_score: z.coerce.number().min(1).max(5, { message: "Valor deve estar entre 1 e 5" }),
  evaluated_percentage: z.coerce.number().min(0).max(100, { message: "Valor deve estar entre 0 e 100" }),
  open_tickets: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
  resolved_tickets: z.coerce.number().min(0, { message: "Valor deve ser positivo" }),
})

type MetricFormValues = z.infer<typeof metricFormSchema>

interface EditMetricDialogProps {
  isOpen: boolean
  onClose: () => void
  metric: any
  onSuccess: () => void
}

export function EditMetricDialog({ isOpen, onClose, metric, onSuccess }: EditMetricDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Inicializar o formulário com os valores da métrica
  const form = useForm<MetricFormValues>({
    resolver: zodResolver(metricFormSchema),
    defaultValues: {
      resolution_rate: metric?.resolution_rate || 0,
      average_response_time: metric?.average_response_time || 0,
      csat_score: metric?.csat_score || 0,
      evaluated_percentage: metric?.evaluated_percentage || 0,
      open_tickets: metric?.open_tickets || 0,
      resolved_tickets: metric?.resolved_tickets || 0,
    },
  })

  const onSubmit = async (data: MetricFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await updateMetric(metric.id, data)
      if (result) {
        toast({
          title: "Métrica atualizada",
          description: `Métrica de ${metric.member} para ${format(new Date(metric.date), "dd/MM/yyyy")} foi atualizada com sucesso.`,
        })
        onSuccess()
        onClose()
      } else {
        throw new Error("Erro ao atualizar métrica")
      }
    } catch (error) {
      console.error("Error updating metric:", error)
      toast({
        title: "Erro ao atualizar métrica",
        description: "Não foi possível atualizar a métrica. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      const success = await deleteMetric(metric.id)
      if (success) {
        toast({
          title: "Métrica excluída",
          description: `Métrica de ${metric.member} para ${format(new Date(metric.date), "dd/MM/yyyy")} foi excluída com sucesso.`,
        })
        onSuccess()
        onClose()
      } else {
        throw new Error("Erro ao excluir métrica")
      }
    } catch (error) {
      console.error("Error deleting metric:", error)
      toast({
        title: "Erro ao excluir métrica",
        description: "Não foi possível excluir a métrica. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Métrica</DialogTitle>
            <DialogDescription>
              Editar métrica de {metric?.member} para {metric?.date ? format(new Date(metric.date), "dd/MM/yyyy") : ""}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="resolution_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Resolução (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="average_response_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo Médio (min)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="csat_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSAT (1-5)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="5" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="evaluated_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>% Avaliados</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="open_tickets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tickets Abertos</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resolved_tickets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tickets Resolvidos</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isSubmitting}
                >
                  Excluir
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta métrica? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
