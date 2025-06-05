"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database, RefreshCw } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function ConfigPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [supabaseUrl, setSupabaseUrl] = useState<string>("")
  const [supabaseKey, setSupabaseKey] = useState<string>("")

  useEffect(() => {
    // Obter as variáveis de ambiente
    setSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    setSupabaseKey(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")
  }, [])

  const testConnection = async () => {
    setIsLoading(true)
    setConnectionStatus("idle")
    setErrorMessage(null)

    try {
      const supabase = getSupabase()

      // Testar a conexão buscando a lista de tabelas
      const { data, error } = await supabase
        .from("pg_catalog.pg_tables")
        .select("tablename")
        .eq("schemaname", "public")
        .limit(1)

      if (error) {
        throw error
      }

      // Se chegou aqui, a conexão foi bem-sucedida
      setConnectionStatus("success")
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
    if (supabaseUrl && supabaseKey) {
      testConnection()
    }
  }, [supabaseUrl, supabaseKey])

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 bg-[#0056D6] text-white">
        <h1 className="text-2xl font-bold">Configuração do Supabase</h1>
        <p className="text-sm text-white/90">Gerencie as configurações de conexão com o Supabase</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status da Conexão</CardTitle>
            <CardDescription>Verifique se a conexão com o Supabase está funcionando corretamente</CardDescription>
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
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Testar conexão
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variáveis de Ambiente</CardTitle>
            <CardDescription>Informações sobre as variáveis de ambiente configuradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">EXPO_PUBLIC_SUPABASE_URL</h3>
                <div className="bg-gray-100 p-3 rounded-md">
                  <code className="text-sm break-all">
                    {supabaseUrl ? supabaseUrl : "Variável de ambiente não definida"}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">EXPO_PUBLIC_SUPABASE_ANON_KEY</h3>
                <div className="bg-gray-100 p-3 rounded-md">
                  <code className="text-sm break-all">
                    {supabaseKey
                      ? `${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 5)}`
                      : "Variável de ambiente não definida"}
                  </code>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="text-sm font-medium mb-2">Como configurar as variáveis de ambiente</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  As variáveis de ambiente são configuradas no painel de controle do Vercel. Para atualizar ou adicionar
                  variáveis de ambiente:
                </p>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Acesse o painel de controle do Vercel</li>
                  <li>Selecione o projeto</li>
                  <li>Vá para a aba "Settings"</li>
                  <li>Clique em "Environment Variables"</li>
                  <li>Adicione ou atualize as variáveis necessárias</li>
                  <li>Clique em "Save" para salvar as alterações</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>O que fazer após configurar o Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                Agora que o Supabase está configurado, você pode prosseguir com os seguintes passos:
              </p>

              <ol className="list-decimal pl-5 text-sm space-y-2">
                <li>
                  <span className="font-medium">Configurar o banco de dados:</span> Acesse a página{" "}
                  <Button variant="link" className="h-auto p-0" asChild>
                    <a href="/admin/setup-database">Configurar Banco de Dados</a>
                  </Button>{" "}
                  para criar as tabelas e funções necessárias.
                </li>
                <li>
                  <span className="font-medium">Cadastrar membros:</span> Adicione os membros da equipe que serão
                  monitorados pelo dashboard.
                </li>
                <li>
                  <span className="font-medium">Cadastrar métricas:</span> Comece a registrar as métricas de atendimento
                  para cada membro.
                </li>
                <li>
                  <span className="font-medium">Visualizar dashboards:</span> Acesse os dashboards para visualizar as
                  métricas e acompanhar o desempenho da equipe.
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
