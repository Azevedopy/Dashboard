"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, Table2 } from "lucide-react"

type TableInfo = {
  name: string
  columns: ColumnInfo[]
  rowCount: number
}

type ColumnInfo = {
  name: string
  dataType: string
  isNullable: boolean
  isPrimaryKey: boolean
}

export default function DatabaseExplorerPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabase()

      // Buscar todas as tabelas do esquema public
      const { data: tablesData, error: tablesError } = await supabase.rpc("get_tables_info")

      if (tablesError) {
        console.error("Error fetching tables:", tablesError)
        return
      }

      // Formatar os dados das tabelas
      const formattedTables: TableInfo[] = []

      for (const table of tablesData || []) {
        // Buscar informações das colunas
        const { data: columnsData, error: columnsError } = await supabase.rpc("get_columns_info", {
          table_name: table.table_name,
        })

        if (columnsError) {
          console.error(`Error fetching columns for table ${table.table_name}:`, columnsError)
          continue
        }

        // Buscar contagem de linhas
        const { count, error: countError } = await supabase
          .from(table.table_name)
          .select("*", { count: "exact", head: true })

        if (countError) {
          console.error(`Error fetching row count for table ${table.table_name}:`, countError)
          continue
        }

        formattedTables.push({
          name: table.table_name,
          columns: (columnsData || []).map((col) => ({
            name: col.column_name,
            dataType: col.data_type,
            isNullable: col.is_nullable === "YES",
            isPrimaryKey: col.is_primary_key,
          })),
          rowCount: count || 0,
        })
      }

      setTables(formattedTables)

      // Selecionar a primeira tabela por padrão
      if (formattedTables.length > 0 && !selectedTable) {
        setSelectedTable(formattedTables[0].name)
        fetchTableData(formattedTables[0].name)
      }
    } catch (error) {
      console.error("Error in fetchTables:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTableData = async (tableName: string) => {
    setIsLoadingData(true)
    try {
      const supabase = getSupabase()

      // Buscar os primeiros 10 registros da tabela
      const { data, error } = await supabase.from(tableName).select("*").limit(10)

      if (error) {
        console.error(`Error fetching data for table ${tableName}:`, error)
        return
      }

      setTableData(data || [])
    } catch (error) {
      console.error("Error in fetchTableData:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
    fetchTableData(tableName)
  }

  const getSelectedTableInfo = () => {
    return tables.find((table) => table.name === selectedTable)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Explorador de Banco de Dados</h1>
        <p className="text-sm text-muted-foreground">Visualize as tabelas e dados do seu banco de dados Supabase</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tabelas Existentes</h2>
          <Button onClick={fetchTables} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-16" />
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tables.map((table) => (
              <Card
                key={table.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTable === table.name ? "border-blue-500 shadow-sm" : ""
                }`}
                onClick={() => handleTableSelect(table.name)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Table2 className="h-5 w-5" />
                    {table.name}
                  </CardTitle>
                  <CardDescription>{table.columns.length} colunas</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{table.rowCount} registros</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedTable && (
          <Tabs defaultValue="schema" className="mt-6">
            <TabsList>
              <TabsTrigger value="schema">Esquema</TabsTrigger>
              <TabsTrigger value="data">Dados</TabsTrigger>
            </TabsList>

            <TabsContent value="schema" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Esquema da Tabela: {selectedTable}</CardTitle>
                  <CardDescription>Estrutura e colunas da tabela selecionada</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coluna</TableHead>
                        <TableHead>Tipo de Dados</TableHead>
                        <TableHead>Nulo</TableHead>
                        <TableHead>Chave Primária</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSelectedTableInfo()?.columns.map((column) => (
                        <TableRow key={column.name}>
                          <TableCell className="font-medium">{column.name}</TableCell>
                          <TableCell>{column.dataType}</TableCell>
                          <TableCell>{column.isNullable ? "Sim" : "Não"}</TableCell>
                          <TableCell>{column.isPrimaryKey ? "Sim" : "Não"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Tabela: {selectedTable}</CardTitle>
                  <CardDescription>Visualização dos primeiros 10 registros</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingData ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                    </div>
                  ) : tableData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(tableData[0]).map((key) => (
                              <TableHead key={key}>{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {Object.values(row).map((value: any, colIndex) => (
                                <TableCell key={colIndex}>
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : value === null
                                      ? "null"
                                      : String(value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">Nenhum dado encontrado</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
