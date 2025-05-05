"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database } from "lucide-react"

export default function SupabaseTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [tables, setTables] = useState<string[]>([])

  const testConnection = async () => {
    setIsLoading(true)
    setConnectionStatus("idle")
    setErrorMessage(null)
    setTables([])

    try {
      const supabase = getSupabase()

      // Testar a conexão buscando a lista de tabelas
      const { data, error } = await supabase
        .from("pg_tables")
        .select("tablename")
        .eq("schemaname", "public")
        .order("tablename")

      if (error) {
        throw error
      }

      // Se chegou aqui, a conexão foi bem-sucedida
      setConnectionStatus("success")
      setTables(data?.map((table) => table.tablename) || [])
    } catch (error) {
      console.error("Error testing Supabase connection:", error)
      setConnectionStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Erro desconhecido ao conectar com o Supabase")
    } finally {
      setIsLoading(false)
    }
  }

  // Testar a conexão automaticamente ao carregar a página
  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Teste de Conexão com Supabase</h1>
        <p className="text-sm text-muted-foreground">
          Verifique se a conexão com o Supabase está funcionando corretamente
        </p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status da Conexão</CardTitle>
            <CardDescription>Resultado do teste de conexão com o Supabase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connectionStatus === "success" && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">Conexão bem-sucedida</AlertTitle>
                <AlertDescription className="text-green-700">
                  A conexão com o Supabase foi estabelecida com sucesso.
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === "error" && (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertTitle>Erro de conexão</AlertTitle>
                <AlertDescription>
                  {errorMessage || "Não foi possível conectar ao Supabase. Verifique as credenciais e tente novamente."}
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={testConnection} disabled={isLoading} className="gap-2">
              <Database className="h-4 w-4" />
              {isLoading ? "Testando conexão..." : "Testar conexão novamente"}
            </Button>

            {tables.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Tabelas disponíveis:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {tables.map((table) => (
                    <li key={table} className="text-sm">
                      {table}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuração do Supabase</CardTitle>
            <CardDescription>Informações sobre a configuração atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">URL do Supabase:</span>{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...`
                    : "Não definido"}
                </code>
              </div>
              <div>
                <span className="font-medium">Chave Anônima:</span>{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...`
                    : "Não definido"}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Estas informações são usadas para conectar ao seu projeto Supabase. Certifique-se de que as variáveis de
                ambiente estão configuradas corretamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
