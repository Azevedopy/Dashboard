"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getSupabase } from "@/lib/supabase"
import { Textarea } from "@/components/ui/textarea"

export default function GenierMetricsRegistrationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado para cada campo do formulário
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [articlesPublished, setArticlesPublished] = useState(0)
  const [virtualAgentAttendances, setVirtualAgentAttendances] = useState(0)
  const [virtualAgentResolved, setVirtualAgentResolved] = useState(0)
  const [virtualAgentUnresolved, setVirtualAgentUnresolved] = useState(0)
  const [registeredMaterials, setRegisteredMaterials] = useState("")
  const [missingMaterials, setMissingMaterials] = useState("")
  const [materialsCount, setMaterialsCount] = useState(0)
  const [unresolvedWithMaterial, setUnresolvedWithMaterial] = useState(false)

  // Função para limpar o formulário
  const handleClear = () => {
    setDate(new Date().toISOString().split("T")[0])
    setArticlesPublished(0)
    setVirtualAgentAttendances(0)
    setVirtualAgentResolved(0)
    setVirtualAgentUnresolved(0)
    setRegisteredMaterials("")
    setMissingMaterials("")
    setMaterialsCount(0)
    setUnresolvedWithMaterial(false)
  }

  // Função para converter texto em formato de lista para array JSON
  const textToJsonArray = (text: string): string[] => {
    if (!text.trim()) return []
    return text
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  // Função para enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = getSupabase()

      // Converter os materiais de texto para arrays JSON
      const registeredMaterialsArray = textToJsonArray(registeredMaterials)
      const missingMaterialsArray = textToJsonArray(missingMaterials)

      // Criar um objeto com os dados a serem inseridos usando os nomes corretos das colunas
      const insertData = {
        date: date,
        articles_published: articlesPublished,
        virtual_agent_attendances: virtualAgentAttendances,
        virtual_agent_resolved: virtualAgentResolved,
        virtual_agent_unresolved: virtualAgentUnresolved,
        registered_materials: registeredMaterialsArray,
        missing_materials: missingMaterialsArray,
        materials_count: materialsCount || registeredMaterialsArray.length, // Usar o valor informado ou contar os materiais registrados
        unresolved_with_material: unresolvedWithMaterial,
      }

      console.log("Tentando inserir dados:", insertData)

      // Inserir métricas do Genier
      const { error } = await supabase.from("metrics_genier").insert([insertData])

      if (error) {
        console.error("Insert error:", error)
        throw new Error(`Erro ao inserir dados: ${error.message}`)
      }

      toast({
        title: "Métricas do Genier cadastradas com sucesso",
        description: `Métricas do Genier para ${new Date(date).toLocaleDateString("pt-BR")} foram salvas.`,
      })

      // Manter a data e limpar os outros campos
      setArticlesPublished(0)
      setVirtualAgentAttendances(0)
      setVirtualAgentResolved(0)
      setVirtualAgentUnresolved(0)
      setRegisteredMaterials("")
      setMissingMaterials("")
      setMaterialsCount(0)
      setUnresolvedWithMaterial(false)
    } catch (error) {
      console.error("Error creating Genier metrics:", error)
      toast({
        title: "Erro ao cadastrar métricas do Genier",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro ao cadastrar as métricas. Tente novamente.",
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
          <h1 className="text-2xl font-bold">Cadastro de Métricas do Genier</h1>
          <p className="text-sm text-muted-foreground">Adicionar métricas do atendente virtual</p>
        </div>
      </div>

      <div className="p-6 overflow-auto">
        <Card className="max-w-2xl mx-auto bg-black text-white">
          <CardHeader>
            <CardTitle>Métricas Genier</CardTitle>
            <CardDescription className="text-gray-400">
              Preencha os dados de métricas do Genier para a data selecionada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="mb-4">
                <Label htmlFor="date" className="text-white">
                  Data
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="articlesPublished" className="text-white">
                    Artigos Publicados
                  </Label>
                  <Input
                    id="articlesPublished"
                    type="number"
                    min="0"
                    value={articlesPublished}
                    onChange={(e) => setArticlesPublished(Number(e.target.value) || 0)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="virtualAgentAttendances" className="text-white">
                    Atendimentos do Agente Virtual
                  </Label>
                  <Input
                    id="virtualAgentAttendances"
                    type="number"
                    min="0"
                    value={virtualAgentAttendances}
                    onChange={(e) => setVirtualAgentAttendances(Number(e.target.value) || 0)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="virtualAgentResolved" className="text-white">
                    Resolvidos pelo Agente Virtual
                  </Label>
                  <Input
                    id="virtualAgentResolved"
                    type="number"
                    min="0"
                    value={virtualAgentResolved}
                    onChange={(e) => setVirtualAgentResolved(Number(e.target.value) || 0)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="virtualAgentUnresolved" className="text-white">
                    Não Resolvidos pelo Agente Virtual
                  </Label>
                  <Input
                    id="virtualAgentUnresolved"
                    type="number"
                    min="0"
                    value={virtualAgentUnresolved}
                    onChange={(e) => setVirtualAgentUnresolved(Number(e.target.value) || 0)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="registeredMaterials" className="text-white">
                    Materiais Registrados
                  </Label>
                  <Textarea
                    id="registeredMaterials"
                    placeholder="Digite um material por linha"
                    className="h-24 bg-gray-900 border-gray-700 text-white"
                    value={registeredMaterials}
                    onChange={(e) => setRegisteredMaterials(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="missingMaterials" className="text-white">
                    Materiais Faltantes
                  </Label>
                  <Textarea
                    id="missingMaterials"
                    placeholder="Digite um material por linha"
                    className="h-24 bg-gray-900 border-gray-700 text-white"
                    value={missingMaterials}
                    onChange={(e) => setMissingMaterials(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Limpar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
