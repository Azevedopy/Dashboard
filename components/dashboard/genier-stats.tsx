import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, FileText, LineChart, HelpCircle } from "lucide-react"

export function GenierStats({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32 bg-gray-800" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16 bg-gray-800" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  // Calcular estatísticas
  const totalArticles = metrics.reduce((sum, item) => sum + (item.articles_published || 0), 0)
  const totalAttendances = metrics.reduce((sum, item) => sum + (item.virtual_agent_attendances || 0), 0)
  const resolvedAttendances = metrics.reduce((sum, item) => sum + (item.virtual_agent_resolved || 0), 0)

  // Obter lista de materiais faltantes únicos
  const missingMaterialsSet = new Set()
  metrics.forEach((item) => {
    if (item.missing_materials && Array.isArray(item.missing_materials)) {
      item.missing_materials.forEach((material) => {
        missingMaterialsSet.add(material)
      })
    } else if (item.missing_materials && typeof item.missing_materials === "object") {
      Object.values(item.missing_materials).forEach((material) => {
        if (typeof material === "string") {
          missingMaterialsSet.add(material)
        }
      })
    }
  })
  const uniqueMissingMaterials = Array.from(missingMaterialsSet)

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-400 text-sm font-normal flex items-center justify-between">
            Total de Artigos Publicados
            <BarChart className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">{totalArticles}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-400 text-sm font-normal flex items-center justify-between">
            Total de Atendimentos
            <FileText className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">{totalAttendances}</div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-400 text-sm font-normal flex items-center justify-between">
            Atendimentos Resolvidos
            <LineChart className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">{resolvedAttendances}</div>
          <div className="text-sm text-gray-400">
            {totalAttendances > 0
              ? `${((resolvedAttendances / totalAttendances) * 100).toFixed(1)}% do total`
              : "0% do total"}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-400 text-sm font-normal flex items-center justify-between">
            Materiais Faltantes
            <HelpCircle className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">{uniqueMissingMaterials.length}</div>
        </CardContent>
      </Card>
    </div>
  )
}
