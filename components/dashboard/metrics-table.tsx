"use client"

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

// Função para formatar minutos para exibição
const formatMinutes = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }
  return `${minutes} min`
}

export function MetricsTable({ metrics, isLoading }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }])

  const columns = [
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Data
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        try {
          return format(parseISO(row.getValue("date")), "dd/MM/yyyy")
        } catch (error) {
          console.error("Error formatting date:", error)
          return row.getValue("date")
        }
      },
    },
    {
      accessorKey: "member",
      header: "Membro",
    },
    {
      accessorKey: "resolution_rate",
      header: "Taxa de Resolução",
      cell: ({ row }) => `${row.getValue("resolution_rate")}%`,
    },
    {
      accessorKey: "average_response_time",
      header: "Tempo de Atendimento",
      cell: ({ row }) => formatMinutes(row.getValue("average_response_time")),
    },
    {
      accessorKey: "csat_score",
      header: "CSAT",
    },
    {
      accessorKey: "evaluated_percentage",
      header: "% Avaliados",
      cell: ({ row }) => `${row.getValue("evaluated_percentage")}%`,
    },
    {
      accessorKey: "open_tickets",
      header: "Tickets Abertos",
    },
    {
      accessorKey: "resolved_tickets",
      header: "Tickets Resolvidos",
    },
  ]

  const table = useReactTable({
    data: metrics || [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-6 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (!metrics || !metrics.length) {
    return <div className="text-center py-4">Nenhum dado disponível para exibição.</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Próximo
        </Button>
      </div>
    </div>
  )
}
