import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dashboard de Métricas de Suporte",
  description: "Dashboard para visualização de métricas de atendimento de suporte",
    generator: 'v0.app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <Sidebar className="hidden md:flex" />
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="md:hidden p-4 border-b border-primary-200 flex items-center bg-white shadow-sm">
                <MobileNav />
                <h1 className="text-lg font-medium ml-4 text-primary-700">Métricas de Suporte</h1>
              </div>
              <main className="flex-1 overflow-auto bg-gradient-to-br from-primary-25 to-white">
                <div className="p-6">{children}</div>
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
