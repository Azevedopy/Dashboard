// Tipos para o sistema de permissões
export type Permission = {
  resource: string
  actions: string[]
}

export type DefaultPermission = {
  id: number
  role_type: string
  permissions: Permission[]
  created_at: string
  updated_at: string
}

// Tipos para membros
export interface Member {
  id: string
  name: string
  email: string
  role: string
  joined_at?: string
  created_at?: string
  avatar_url?: string
  access_type?: string
  service_type?: string
}

// Tipos para métricas
export interface MetricEntry {
  id?: string
  date: string
  member_id: string
  member_name?: string
  resolution_rate: number
  average_response_time: number
  csat_score: number
  evaluated_percentage: number
  open_tickets: number
  resolved_tickets: number
  // Propriedades em camelCase para compatibilidade
  resolutionRate?: number
  averageResponseTime?: number
  csatScore?: number
  evaluatedPercentage?: number
  openTickets?: number
  resolvedTickets?: number
}

export type DailyMetric = {
  date: string
  resolution_rate: number
  average_response_time: number
  csat_score: number
  evaluated_percentage: number
  open_tickets: number
  resolved_tickets: number
}

export type MemberMetrics = {
  member: Member
  metrics: MetricEntry[]
}

// Tipo para projetos de consultoria - atualizado para corresponder exatamente à estrutura da tabela
export type ConsultingProject = {
  id: string
  cliente: string
  tipo: string
  data_inicio: string
  data_termino: string
  tempo_dias: number
  porte: string
  avaliacao?: string
  valor_consultoria: number
  valor_bonus: number
  created_at?: string
  updated_at?: string
  porte_detalhado?: string
  data_virada?: string
  data_fechamento?: string
  nota_consultoria?: number
  consultor?: string
  valor_bonus_12?: number
  avaliacao_estrelas?: number
  prazo_atingido?: boolean
  status?: string
  data_finalizacao?: string
  valor_comissao?: number
  percentual_comissao?: number
  bonificada?: boolean
  assinatura_fechamento?: boolean // Campo para confirmar assinatura do cliente
  data_pausa?: string // Campo para registrar quando foi pausado
  dias_pausados?: number // Campo para contar total de dias pausados
}

// Tipo para estatísticas de consultoria
export type ConsultingStats = {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  averageRating: number
  totalRevenue: number
  averageProjectDuration: number
  deadlineComplianceRate: number
}

// Tipo para projetos Genier
export type GenierProject = {
  id: string
  cliente: string
  tipo: string
  data_inicio: string
  data_termino: string
  tempo_dias: number
  porte: string
  avaliacao?: string
  valor_consultoria: number
  valor_bonus: number
  created_at?: string
  updated_at?: string
  porte_detalhado?: string
  data_virada?: string
  data_fechamento?: string
  nota_consultoria?: number
  consultor?: string
  valor_bonus_12?: number
  avaliacao_estrelas?: number
  prazo_atingido?: boolean
  status?: string
  data_finalizacao?: string
  valor_comissao?: number
  percentual_comissao?: number
}

// Tipo para estatísticas de Genier
export type GenierStats = {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  averageRating: number
  totalRevenue: number
  averageProjectDuration: number
  deadlineComplianceRate: number
}

// Novo tipo para a tabela fornecida (todos os campos são opcionais)
export type SupportProject = {
  id?: string
  cliente?: string
  tipo?: string
  data_inicio?: string
  data_termino?: string
  tempo_dias?: number
  porte?: string
  avaliacao?: string
  valor_consultoria?: number
  valor_bonus?: number
  created_at?: string
  updated_at?: string
  porte_detalhado?: string
  data_virada?: string
  data_fechamento?: string
  nota_consultoria?: number
  consultor?: string
  valor_bonus_12?: number
  avaliacao_estrelas?: number
  prazo_atingido?: boolean
  status?: string
  data_finalizacao?: string
  valor_comissao?: number
  percentual_comissao?: number
}

// Tipo para estatísticas de projetos de suporte
export type SupportStats = {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  averageRating: number
  totalRevenue: number
  averageProjectDuration: number
  deadlineComplianceRate: number
}

// Tipos para métricas de consultoria
export interface ConsultingMetric {
  id?: string
  date: string
  member_id?: string // Agora é opcional
  consultor: string
  client: string
  project_type: string
  status: string
  size: string
  size_detail: string
  start_date: string
  end_date: string
  duration: number
  closing_date?: string | null
  turning_date?: string | null
  consulting_value: number
  bonus_8_percent: number
  bonus_12_percent: number
  is_bonificada?: boolean // Novo campo
  // Campos de avaliação
  avaliacao_estrelas?: number
  nota_consultoria?: string
  data_finalizacao?: string
  prazo_atingido?: boolean
  valor_comissao?: number
  percentual_comissao?: number
}
