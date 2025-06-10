// Sistema de cores fixas para agentes
// Cada agente terá sempre a mesma cor em todos os gráficos

const AGENT_COLOR_PALETTE = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
  "#14b8a6", // teal-500
  "#eab308", // yellow-500
  "#dc2626", // red-600
  "#059669", // emerald-600
  "#d97706", // amber-600
  "#7c3aed", // violet-600
  "#0891b2", // cyan-600
  "#ea580c", // orange-600
  "#65a30d", // lime-600
  "#db2777", // pink-600
]

// Cache para armazenar as cores atribuídas
const agentColorCache = new Map<string, string>()

/**
 * Obtém uma cor fixa para um agente específico
 * A cor será sempre a mesma para o mesmo agente em toda a aplicação
 */
export function getAgentColor(agentName: string): string {
  // Se já temos uma cor para este agente, retornar ela
  if (agentColorCache.has(agentName)) {
    return agentColorCache.get(agentName)!
  }

  // Gerar um hash simples do nome do agente para garantir consistência
  let hash = 0
  for (let i = 0; i < agentName.length; i++) {
    const char = agentName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Converter para 32bit integer
  }

  // Usar o hash para selecionar uma cor da paleta
  const colorIndex = Math.abs(hash) % AGENT_COLOR_PALETTE.length
  const color = AGENT_COLOR_PALETTE[colorIndex]

  // Armazenar no cache para uso futuro
  agentColorCache.set(agentName, color)

  return color
}

/**
 * Obtém cores para uma lista de agentes
 * Garante que cada agente tenha uma cor única e consistente
 */
export function getAgentColors(agentNames: string[]): Record<string, string> {
  const colors: Record<string, string> = {}

  agentNames.forEach((agentName) => {
    colors[agentName] = getAgentColor(agentName)
  })

  return colors
}

/**
 * Limpa o cache de cores (útil para testes ou reset)
 */
export function clearAgentColorCache(): void {
  agentColorCache.clear()
}

/**
 * Obtém todas as cores atualmente em cache
 */
export function getCachedAgentColors(): Record<string, string> {
  return Object.fromEntries(agentColorCache.entries())
}
