export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type DemandTypeName = 'support' | 'bug' | 'improvement' | 'feature_request' | 'commercial_request' | 'technical_investigation';

export interface DemandType {
  id: string;
  name: DemandTypeName;
  label: string;
  color: string; // HSL string
  description: string;
}

export type ClientPlan = 'starter' | 'professional' | 'enterprise' | 'custom';
export type ClientHealth = 'healthy' | 'attention' | 'critical';
export type ClientRisk = 'low' | 'medium' | 'high';

export const CLIENT_PLAN_CONFIG: Record<ClientPlan, { label: string; className: string }> = {
  starter: { label: 'Starter', className: 'bg-muted text-muted-foreground' },
  professional: { label: 'Professional', className: 'bg-primary/15 text-primary' },
  enterprise: { label: 'Enterprise', className: 'bg-accent-medium/15 text-accent-medium' },
  custom: { label: 'Personalizado', className: 'bg-accent-high/15 text-accent-high' },
};

export const CLIENT_HEALTH_CONFIG: Record<ClientHealth, { label: string; className: string }> = {
  healthy: { label: 'Saudável', className: 'bg-accent-low/15 text-accent-low' },
  attention: { label: 'Atenção', className: 'bg-accent-medium/15 text-accent-medium' },
  critical: { label: 'Crítico', className: 'bg-accent-urgent/15 text-accent-urgent' },
};

export const CLIENT_RISK_CONFIG: Record<ClientRisk, { label: string; className: string }> = {
  low: { label: 'Baixo', className: 'bg-accent-low/15 text-accent-low' },
  medium: { label: 'Médio', className: 'bg-accent-medium/15 text-accent-medium' },
  high: { label: 'Alto', className: 'bg-accent-urgent/15 text-accent-urgent' },
};

export interface Client {
  id: string;
  name: string;
  company: string;
  segment: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  status: 'active' | 'inactive';
  createdAt: string;
  accountManager: string;
  plan: ClientPlan;
  healthScore: ClientHealth;
  riskLevel: ClientRisk;
  satisfaction: number; // 1-5
  strategicNotes: string;
}

export interface ClientHistoryEvent {
  id: string;
  clientId: string;
  type: 'created' | 'updated' | 'archived' | 'reactivated';
  description: string;
  user: string;
  timestamp: string;
  changes?: Record<string, { from: string; to: string }>;
}

export interface ActivityEvent {
  id: string;
  demandId: string;
  type: 'created' | 'moved' | 'assigned' | 'blocked' | 'unblocked' | 'edited' | 'completed' | 'comment';
  description: string;
  user: string;
  timestamp: string;
  meta?: Record<string, string>;
}

export interface Comment {
  id: string;
  demandId: string;
  user: string;
  content: string;
  timestamp: string;
}

export interface Demand {
  id: string;
  title: string;
  description: string;
  expectedResult: string;
  clientId: string;
  demandTypeId: string;
  priority: Priority;
  assignee: string;
  watchers: string[];
  tags: string[];
  columnId: string;
  order: number;

  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  blockedAt: string | null;
  lastUpdated: string;

  estimatedEffort: string;
  actualEffort: string;
  isBlocked: boolean;
  blockerReason: string;
  blockedBy: string;
  cancellationReason: string;
  notes: string;
  attachments: string[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  order: number;
  collapsed: boolean;
}

export type BlockerReason =
  | 'waiting_client'
  | 'waiting_developer'
  | 'waiting_third_party'
  | 'internal_dependency'
  | 'urgent_priority_change';

export type CancellationReason =
  | 'client_changed_priority'
  | 'scope_changed'
  | 'duplicate_request'
  | 'lack_of_response'
  | 'strategic_review';

export const BLOCKER_REASONS: Record<BlockerReason, string> = {
  waiting_client: 'Aguardando cliente',
  waiting_developer: 'Aguardando desenvolvedor',
  waiting_third_party: 'Aguardando terceiro',
  internal_dependency: 'Dependência interna',
  urgent_priority_change: 'Mudança de prioridade urgente',
};

export const CANCELLATION_REASONS: Record<CancellationReason, string> = {
  client_changed_priority: 'Cliente mudou a prioridade',
  scope_changed: 'Escopo alterado',
  duplicate_request: 'Solicitação duplicada',
  lack_of_response: 'Falta de resposta do cliente',
  strategic_review: 'Revisão estratégica',
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Baixa', className: 'bg-accent-low/15 text-accent-low' },
  medium: { label: 'Média', className: 'bg-accent-medium/15 text-accent-medium' },
  high: { label: 'Alta', className: 'bg-accent-high/15 text-accent-high' },
  urgent: { label: 'Crítica', className: 'bg-accent-urgent/15 text-accent-urgent' },
};
