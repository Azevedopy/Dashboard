// Função para verificar se o prazo foi atingido com base no tipo de plano
export function isPrazoAtingido(tipo: string, tempoDias: number): boolean {
  const prazos: Record<string, number> = {
    Basic: 15,
    Starter: 25,
    Pro: 40,
    Enterprise: 60,
  }

  // Obter o prazo máximo para o tipo de plano
  const prazoMaximo = prazos[tipo] || 30 // Default para tipos desconhecidos

  // Verificar se o tempo de duração é menor ou igual ao prazo máximo
  return tempoDias <= prazoMaximo
}

// Função para calcular o percentual de comissão
export function calculateCommissionPercentage(avaliacao: number, prazoAtingido: boolean): number {
  // 0% → Se a nota for 3 ou menor (independente do prazo)
  if (avaliacao <= 3) {
    return 0
  }

  // 8% → Se Prazo Atingido = NÃO e a nota for 4 ou 5
  if (!prazoAtingido && avaliacao >= 4) {
    return 8
  }

  // 12% → Se Prazo Atingido = SIM e a nota for 4 ou 5
  if (prazoAtingido && avaliacao >= 4) {
    return 12
  }

  return 0 // Caso padrão
}

// Função para calcular o valor da comissão
export function calculateCommission(
  valorConsultoria: number,
  avaliacao: number,
  prazoAtingido: boolean,
): { percentual: number; valor: number } {
  const percentual = calculateCommissionPercentage(avaliacao, prazoAtingido)
  const valor = (valorConsultoria * percentual) / 100

  return { percentual, valor }
}
