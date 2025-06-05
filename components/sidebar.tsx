"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Users, Settings, BarChart2, Upload, UserCog, Database, Shield } from "lucide-react"

import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      title: "Dashboards",
      icon: BarChart2,
      submenu: [
        {
          title: "Suporte",
          href: "/dashboard/suporte",
          submenu: [
            { title: "Visão Geral", href: "/dashboard/suporte/visao-geral" },
            { title: "Gráficos", href: "/dashboard/suporte/graficos" },
          ],
        },
        {
          title: "Consultoria",
          href: "/dashboard/consultoria",
          submenu: [
            { title: "Visão Geral", href: "/dashboard/consultoria/visao-geral" },
            { title: "Gráficos", href: "/dashboard/consultoria/graficos" },
            { title: "Consultorias em Andamento", href: "/dashboard/consultoria/em-andamento" },
            { title: "Consultorias Concluídas", href: "/dashboard/consultoria/concluidas" },
          ],
        },
        {
          title: "Genier",
          href: "/dashboard/genier",
          submenu: [
            { title: "Visão Geral", href: "/dashboard/genier/visao-geral" },
            { title: "Gráficos", href: "/dashboard/genier/graficos" },
          ],
        },
      ],
    },
    {
      title: "Cadastros Métricas",
      icon: Upload,
      submenu: [
        { title: "Suporte", href: "/cadastro-metricas/suporte" },
        { title: "Consultoria", href: "/cadastro-metricas/consultoria" },
        { title: "Genier", href: "/cadastro-metricas/genier" },
      ],
    },
    {
      title: "Administrativo",
      icon: Settings,
      submenu: [
        { title: "Cadastro de Membros", href: "/admin/membros", icon: Users },
        { title: "Grupos de Acesso", href: "/admin/grupos", icon: UserCog },
        { title: "Permissões", href: "/admin/permissions", icon: Shield },
        { title: "Explorador de BD", href: "/admin/database-explorer", icon: Database },
        { title: "Teste Supabase", href: "/admin/supabase-test", icon: Database },
        { title: "Configurar BD", href: "/admin/setup-database", icon: Database },
        { title: "Configuração", href: "/admin/config", icon: Database },
      ],
    },
  ]

  return (
    <div className="flex flex-col h-full bg-[#0056D6] border-r border-blue-700 w-64 p-4 shadow-lg" {...props}>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Métricas de Suporte</h1>
        <p className="text-sm text-white/80">Dashboard de atendimento</p>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item, index) => (
          <Collapsible key={index} className="w-full">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-white transition-all hover:bg-blue-700 group">
              <div className="flex items-center">
                <item.icon className="h-5 w-5 mr-2" />
                <span className="font-medium">{item.title}</span>
              </div>
              {item.submenu && (
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-10 space-y-1 mt-1">
              {item.submenu?.map((subItem, subIndex) => {
                const isActive = pathname === subItem.href

                // Verificar se este subitem tem seu próprio submenu
                if (subItem.submenu) {
                  return (
                    <Collapsible key={subIndex} className="w-full">
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-white/90 transition-all hover:bg-blue-700 group">
                        <span className="font-medium">{subItem.title}</span>
                        <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-6 space-y-1 mt-1">
                        {subItem.submenu.map((nestedItem, nestedIndex) => {
                          const isNestedActive = pathname === nestedItem.href
                          return (
                            <Link
                              key={nestedIndex}
                              href={nestedItem.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all",
                                isNestedActive
                                  ? "bg-white text-[#0056D6] font-medium"
                                  : "text-white/80 hover:bg-blue-700 hover:text-white",
                              )}
                            >
                              {nestedItem.icon && <nestedItem.icon className="h-3 w-3" />}
                              <span>{nestedItem.title}</span>
                            </Link>
                          )
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                }

                // Renderizar link normal para subitens sem submenu
                return (
                  <Link
                    key={subIndex}
                    href={subItem.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                      isActive
                        ? "bg-white text-[#0056D6] font-medium"
                        : "text-white/80 hover:bg-blue-700 hover:text-white",
                    )}
                  >
                    {subItem.icon && <subItem.icon className="h-4 w-4" />}
                    <span>{subItem.title}</span>
                  </Link>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
    </div>
  )
}
