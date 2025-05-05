"use client"

import { useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database, Play } from "lucide-react"

export default function SetupDatabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const setupDatabase = async () => {
    setIsLoading(true)
    setSetupStatus("idle")
    setErrorMessage(null)
    setLogs([])

    try {
      const supabase = getSupabase()

      // Adicionar log
      addLog("Iniciando configuração do banco de dados...")

      // Verificar se a tabela members existe
      addLog("Verificando tabela 'members'...")
      const { error: membersCheckError } = await supabase.from("members").select("id").limit(1)

      if (membersCheckError && membersCheckError.code === "PGRST116") {
        addLog("Tabela 'members' não encontrada. Criando...")

        // Criar tabela members
        const { error: createMembersError } = await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS members (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              role VARCHAR(100) NOT NULL,
              avatar_url TEXT,
              joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        })

        if (createMembersError) {
          throw new Error(`Erro ao criar tabela members: ${createMembersError.message}`)
        }

        addLog("Tabela 'members' criada com sucesso!")
      } else {
        addLog("Tabela 'members' já existe.")
      }

      // Verificar se a tabela metrics existe
      addLog("Verificando tabela 'metrics'...")
      const { error: metricsCheckError } = await supabase.from("metrics").select("id").limit(1)

      if (metricsCheckError && metricsCheckError.code === "PGRST116") {
        addLog("Tabela 'metrics' não encontrada. Criando...")

        // Criar tabela metrics
        const { error: createMetricsError } = await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS metrics (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              member_id UUID NOT NULL REFERENCES members(id),
              date DATE NOT NULL,
              resolution_rate NUMERIC NOT NULL,
              average_response_time NUMERIC NOT NULL,
              csat_score NUMERIC NOT NULL,
              evaluated_percentage NUMERIC NOT NULL,
              open_tickets INTEGER NOT NULL,
              resolved_tickets INTEGER NOT NULL,
              service_type VARCHAR(50) DEFAULT 'suporte',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(member_id, date, service_type)
            );
          `,
        })

        if (createMetricsError) {
          throw new Error(`Erro ao criar tabela metrics: ${createMetricsError.message}`)
        }

        addLog("Tabela 'metrics' criada com sucesso!")
      } else {
        addLog("Tabela 'metrics' já existe.")
      }

      // Criar função RPC para inserir métricas
      addLog("Criando função RPC 'insert_metric'...")
      const { error: createFunctionError } = await supabase.rpc("execute_sql", {
        sql_query: `
          CREATE OR REPLACE FUNCTION insert_metric(
            p_member_id UUID,
            p_date DATE,
            p_resolution_rate NUMERIC,
            p_average_response_time NUMERIC,
            p_csat_score NUMERIC,
            p_evaluated_percentage NUMERIC,
            p_open_tickets INTEGER,
            p_resolved_tickets INTEGER,
            p_service_type VARCHAR DEFAULT 'suporte'
          ) RETURNS VOID AS $$
          BEGIN
            INSERT INTO metrics (
              member_id,
              date,
              resolution_rate,
              average_response_time,
              csat_score,
              evaluated_percentage,
              open_tickets,
              resolved_tickets,
              service_type
            ) VALUES (
              p_member_id,
              p_date,
              p_resolution_rate,
              p_average_response_time,
              p_csat_score,
              p_evaluated_percentage,
              p_open_tickets,
              p_resolved_tickets,
              p_service_type
            )
            ON CONFLICT (member_id, date, service_type) 
            DO UPDATE SET
              resolution_rate = p_resolution_rate,
              average_response_time = p_average_response_time,
              csat_score = p_csat_score,
              evaluated_percentage = p_evaluated_percentage,
              open_tickets = p_open_tickets,
              resolved_tickets = p_resolved_tickets;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;

          -- Conceder permissão para anon e authenticated roles
          GRANT EXECUTE ON FUNCTION insert_metric TO anon, authenticated;
        `,
      })

      if (createFunctionError) {
        throw new Error(`Erro ao criar função RPC: ${createFunctionError.message}`)
      }

      addLog("Função RPC 'insert_metric' criada com sucesso!")

      // Criar função execute_sql se não existir
      addLog("Verificando função 'execute_sql'...")
      const { error: checkExecuteSqlError } = await supabase.rpc("execute_sql", {
        sql_query: "SELECT 1;",
      })

      if (checkExecuteSqlError && checkExecuteSqlError.code === "PGRST116") {
        addLog("Função 'execute_sql' não encontrada. Criando...")

        // Criar função execute_sql usando SQL direto
        // Nota: Esta parte pode não funcionar diretamente, pois precisamos de permissões de superusuário
        addLog("AVISO: A função 'execute_sql' precisa ser criada manualmente pelo administrador do banco de dados.")
      } else {
        addLog("Função 'execute_sql' já existe.")
      }

      // Se chegou aqui, a configuração foi bem-sucedida
      setSetupStatus("success")
      addLog("Configuração do banco de dados concluída com sucesso!")
    } catch (error) {
      console.error("Error setting up database:", error)
      setSetupStatus("error")
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido ao configurar o banco de dados"
      setErrorMessage(errorMsg)
      addLog(`ERRO: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, message])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Configuração do Banco de Dados</h1>
        <p className="text-sm text-muted-foreground">Configure as tabelas e funções necessárias no Supabase</p>
      </div>

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Banco de Dados</CardTitle>
            <CardDescription>Crie as tabelas e funções necessárias para o funcionamento da aplicação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupStatus === "success" && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">Configuração concluída</AlertTitle>
                <AlertDescription className="text-green-700">
                  O banco de dados foi configurado com sucesso.
                </AlertDescription>
              </Alert>
            )}

            {setupStatus === "error" && (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertTitle>Erro na configuração</AlertTitle>
                <AlertDescription>
                  {errorMessage || "Ocorreu um erro durante a configuração do banco de dados."}
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={setupDatabase} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Database className="h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Iniciar Configuração
                </>
              )}
            </Button>

            {logs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Logs:</h3>
                <div className="bg-gray-100 p-3 rounded-md max-h-60 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      {log.startsWith("ERRO:") ? (
                        <span className="text-red-600">{log}</span>
                      ) : log.includes("sucesso") ? (
                        <span className="text-green-600">{log}</span>
                      ) : (
                        <span>{log}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instruções Manuais</CardTitle>
            <CardDescription>Se a configuração automática falhar, siga estas instruções</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                Se a configuração automática falhar, você pode executar os seguintes comandos SQL diretamente no console
                SQL do Supabase:
              </p>

              <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                <pre className="text-xs">
                  {`-- Criar tabela members
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela metrics
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  date DATE NOT NULL,
  resolution_rate NUMERIC NOT NULL,
  average_response_time NUMERIC NOT NULL,
  csat_score NUMERIC NOT NULL,
  evaluated_percentage NUMERIC NOT NULL,
  open_tickets INTEGER NOT NULL,
  resolved_tickets INTEGER NOT NULL,
  service_type VARCHAR(50) DEFAULT 'suporte',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, date, service_type)
);

-- Criar função RPC para inserir métricas
CREATE OR REPLACE FUNCTION insert_metric(
  p_member_id UUID,
  p_date DATE,
  p_resolution_rate NUMERIC,
  p_average_response_time NUMERIC,
  p_csat_score NUMERIC,
  p_evaluated_percentage NUMERIC,
  p_open_tickets INTEGER,
  p_resolved_tickets INTEGER,
  p_service_type VARCHAR DEFAULT 'suporte'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO metrics (
    member_id,
    date,
    resolution_rate,
    average_response_time,
    csat_score,
    evaluated_percentage,
    open_tickets,
    resolved_tickets,
    service_type
  ) VALUES (
    p_member_id,
    p_date,
    p_resolution_rate,
    p_average_response_time,
    p_csat_score,
    p_evaluated_percentage,
    p_open_tickets,
    p_resolved_tickets,
    p_service_type
  )
  ON CONFLICT (member_id, date, service_type) 
  DO UPDATE SET
    resolution_rate = p_resolution_rate,
    average_response_time = p_average_response_time,
    csat_score = p_csat_score,
    evaluated_percentage = p_evaluated_percentage,
    open_tickets = p_open_tickets,
    resolved_tickets = p_resolved_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão para anon e authenticated roles
GRANT EXECUTE ON FUNCTION insert_metric TO anon, authenticated;`}
                </pre>
              </div>

              <p className="text-sm text-muted-foreground">
                Execute estes comandos no console SQL do Supabase para criar as tabelas e funções necessárias.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
