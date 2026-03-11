export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type DemandTypeName = 'support' | 'bug' | 'improvement' | 'feature_request' | 'commercial_request' | 'technical_investigation';

export interface DemandType {
  id: string;
  name: DemandTypeName;
  label: string;
  color: string; // HSL string
  description: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  segment: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  status: 'active' | 'inactive';
  createdAt: string;
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
  clientId: string;
  demandTypeId: string;
  priority: Priority;
  assignee: string;
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
  waiting_client: 'Waiting for client',
  waiting_developer: 'Waiting for developer',
  waiting_third_party: 'Waiting for third party',
  internal_dependency: 'Internal dependency',
  urgent_priority_change: 'Urgent priority change',
};

export const CANCELLATION_REASONS: Record<CancellationReason, string> = {
  client_changed_priority: 'Client changed priority',
  scope_changed: 'Scope changed',
  duplicate_request: 'Duplicate request',
  lack_of_response: 'Lack of client response',
  strategic_review: 'Strategic review',
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-accent-low/15 text-accent-low' },
  medium: { label: 'Medium', className: 'bg-accent-medium/15 text-accent-medium' },
  high: { label: 'High', className: 'bg-accent-high/15 text-accent-high' },
  urgent: { label: 'Urgent', className: 'bg-accent-urgent/15 text-accent-urgent' },
};
