import { create } from 'zustand';
import type { Demand, KanbanColumn, Client, DemandType, ActivityEvent, Comment } from '@/types';

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', order: 0, collapsed: false },
  { id: 'todo', title: 'A Fazer', order: 1, collapsed: false },
  { id: 'in_progress', title: 'Em Progresso', order: 2, collapsed: false },
  { id: 'waiting', title: 'Aguardando', order: 3, collapsed: false },
  { id: 'review', title: 'Em Revisão', order: 4, collapsed: false },
  { id: 'done', title: 'Concluído', order: 5, collapsed: false },
  { id: 'canceled', title: 'Cancelado', order: 6, collapsed: false },
];

const DEFAULT_DEMAND_TYPES: DemandType[] = [
  { id: 'dt1', name: 'support', label: 'Suporte', color: '210 70% 55%', description: 'Solicitações gerais de suporte' },
  { id: 'dt2', name: 'bug', label: 'Bug', color: '0 72% 51%', description: 'Relatórios e correções de bugs' },
  { id: 'dt3', name: 'improvement', label: 'Ajuste', color: '280 60% 55%', description: 'Melhorias em funcionalidades existentes' },
  { id: 'dt4', name: 'feature_request', label: 'Nova Funcionalidade', color: '170 60% 45%', description: 'Solicitações de novas funcionalidades' },
  { id: 'dt5', name: 'commercial_request', label: 'Comercial', color: '30 80% 50%', description: 'Solicitações comerciais e de negócios' },
  { id: 'dt6', name: 'technical_investigation', label: 'Investigação', color: '240 40% 55%', description: 'Pesquisa e investigação técnica' },
];

const DEFAULT_CLIENTS: Client[] = [
  { id: 'c1', name: 'Acme Corp', company: 'Acme Corporation', segment: 'Corporativo', contactName: 'João Silva', email: 'joao@acme.com', phone: '+55 11 99999-0101', notes: 'Conta corporativa estratégica', status: 'active', createdAt: '2024-01-15T10:00:00Z', accountManager: 'Jordan Lee' },
  { id: 'c2', name: 'TechStart', company: 'TechStart Inc', segment: 'Startup', contactName: 'Sara Chen', email: 'sara@techstart.io', phone: '+55 11 99999-0102', notes: 'Startup em crescimento acelerado', status: 'active', createdAt: '2024-02-20T10:00:00Z', accountManager: 'Sam Taylor' },
  { id: 'c3', name: 'GlobalRetail', company: 'Global Retail Ltda', segment: 'Varejo', contactName: 'Marcos Souza', email: 'marcos@globalretail.com', phone: '+55 11 99999-0103', notes: 'Grande rede de varejo', status: 'active', createdAt: '2024-03-10T10:00:00Z', accountManager: 'Alex Rivera' },
];

const now = () => new Date().toISOString();

const SAMPLE_DEMANDS: Demand[] = [
  { id: 'd1', title: 'Corrigir bug de autenticação na API', description: 'Tokens de autenticação estão expirando prematuramente, causando erros 401 para os usuários.', expectedResult: 'Tokens devem persistir por 24h sem necessidade de reautenticação.', clientId: 'c1', demandTypeId: 'dt2', priority: 'urgent', assignee: 'Alex Rivera', watchers: ['Jordan Lee'], tags: ['api', 'auth'], columnId: 'in_progress', order: 0, createdAt: '2024-06-01T09:00:00Z', startedAt: '2024-06-02T10:00:00Z', finishedAt: null, blockedAt: null, lastUpdated: '2024-06-03T14:00:00Z', estimatedEffort: '4h', actualEffort: '2h', isBlocked: false, blockerReason: '', blockedBy: '', cancellationReason: '', notes: '', attachments: [] },
  { id: 'd2', title: 'Adicionar exportação para CSV', description: 'Usuários precisam exportar relatórios em formato CSV para análise offline.', expectedResult: 'Botão de download na página de relatórios que gera um arquivo CSV.', clientId: 'c2', demandTypeId: 'dt4', priority: 'medium', assignee: 'Jordan Lee', watchers: [], tags: ['exportação', 'relatórios'], columnId: 'todo', order: 0, createdAt: '2024-06-02T11:00:00Z', startedAt: null, finishedAt: null, blockedAt: null, lastUpdated: '2024-06-02T11:00:00Z', estimatedEffort: '8h', actualEffort: '', isBlocked: false, blockerReason: '', blockedBy: '', cancellationReason: '', notes: '', attachments: [] },
  { id: 'd3', title: 'Painel carregando lentamente', description: 'O painel principal leva mais de 5 segundos para carregar em contas com mais de 1000 registros.', expectedResult: 'O painel deve carregar em menos de 2 segundos para todos os tamanhos de conta.', clientId: 'c1', demandTypeId: 'dt2', priority: 'high', assignee: 'Alex Rivera', watchers: ['Sam Taylor'], tags: ['performance'], columnId: 'backlog', order: 0, createdAt: '2024-06-03T08:00:00Z', startedAt: null, finishedAt: null, blockedAt: null, lastUpdated: '2024-06-03T08:00:00Z', estimatedEffort: '16h', actualEffort: '', isBlocked: false, blockerReason: '', blockedBy: '', cancellationReason: '', notes: '', attachments: [] },
  { id: 'd4', title: 'Redesign do fluxo de onboarding', description: 'Redesenhar o fluxo de onboarding para reduzir a taxa de abandono em 30%.', expectedResult: 'Novo onboarding com menos etapas e maior taxa de conclusão.', clientId: 'c3', demandTypeId: 'dt3', priority: 'medium', assignee: 'Sam Taylor', watchers: [], tags: ['ux', 'onboarding'], columnId: 'waiting', order: 0, createdAt: '2024-05-20T10:00:00Z', startedAt: '2024-05-22T09:00:00Z', finishedAt: null, blockedAt: '2024-06-01T10:00:00Z', lastUpdated: '2024-06-01T10:00:00Z', estimatedEffort: '40h', actualEffort: '12h', isBlocked: true, blockerReason: 'Aguardando cliente', blockedBy: 'Sam Taylor', cancellationReason: '', notes: 'Cliente precisa aprovar os novos mockups', attachments: [] },
  { id: 'd5', title: 'Integração SSO', description: 'Implementar SSO baseado em SAML para clientes corporativos.', expectedResult: 'Usuários corporativos podem fazer login pelo provedor SSO da empresa.', clientId: 'c1', demandTypeId: 'dt4', priority: 'high', assignee: 'Jordan Lee', watchers: ['Alex Rivera'], tags: ['sso', 'corporativo'], columnId: 'review', order: 0, createdAt: '2024-05-15T10:00:00Z', startedAt: '2024-05-18T09:00:00Z', finishedAt: null, blockedAt: null, lastUpdated: '2024-06-02T16:00:00Z', estimatedEffort: '24h', actualEffort: '20h', isBlocked: false, blockerReason: '', blockedBy: '', cancellationReason: '', notes: '', attachments: [] },
  { id: 'd6', title: 'Atualizar textos da página de cobrança', description: 'Atualizar textos da página de cobrança conforme solicitação do time de marketing.', expectedResult: 'Página de cobrança reflete a nova comunicação da marca.', clientId: 'c2', demandTypeId: 'dt5', priority: 'low', assignee: 'Sam Taylor', watchers: [], tags: ['conteúdo'], columnId: 'done', order: 0, createdAt: '2024-05-10T10:00:00Z', startedAt: '2024-05-11T09:00:00Z', finishedAt: '2024-05-12T14:00:00Z', blockedAt: null, lastUpdated: '2024-05-12T14:00:00Z', estimatedEffort: '2h', actualEffort: '1.5h', isBlocked: false, blockerReason: '', blockedBy: '', cancellationReason: '', notes: '', attachments: [] },
  { id: 'd7', title: 'Investigar vazamento de memória', description: 'Memória do processo Node cresce ao longo do tempo em produção. Necessita profiling.', expectedResult: 'Causa raiz identificada e uso de memória estabilizado.', clientId: 'c3', demandTypeId: 'dt6', priority: 'high', assignee: 'Alex Rivera', watchers: [], tags: ['devops', 'performance'], columnId: 'backlog', order: 1, createdAt: '2024-06-04T10:00:00Z', startedAt: null, finishedAt: null, blockedAt: null, lastUpdated: '2024-06-04T10:00:00Z', estimatedEffort: '12h', actualEffort: '', isBlocked: false, blockerReason: '', blockedBy: '', cancellationReason: '', notes: '', attachments: [] },
];

const SAMPLE_ACTIVITY: ActivityEvent[] = [
  { id: 'a1', demandId: 'd1', type: 'created', description: 'Demanda criada', user: 'Sistema', timestamp: '2024-06-01T09:00:00Z' },
  { id: 'a2', demandId: 'd1', type: 'moved', description: 'Movido de Backlog para Em Progresso', user: 'Alex Rivera', timestamp: '2024-06-02T10:00:00Z', meta: { from: 'backlog', to: 'in_progress' } },
  { id: 'a3', demandId: 'd4', type: 'blocked', description: 'Bloqueado: Aguardando cliente', user: 'Sam Taylor', timestamp: '2024-06-01T10:00:00Z' },
];

interface Filters {
  clientId: string;
  demandTypeId: string;
  assignee: string;
  priority: string;
  tags: string[];
  search: string;
  blockedStatus: string; // 'all' | 'blocked' | 'not_blocked'
  dateFrom: string;
  dateTo: string;
}

interface AppState {
  columns: KanbanColumn[];
  demands: Demand[];
  clients: Client[];
  demandTypes: DemandType[];
  activity: ActivityEvent[];
  comments: Comment[];
  filters: Filters;
  selectedDemandId: string | null;
  globalSearch: string;

  // Actions
  setFilters: (filters: Partial<Filters>) => void;
  clearFilters: () => void;
  setSelectedDemand: (id: string | null) => void;
  setGlobalSearch: (search: string) => void;

  addDemand: (demand: Omit<Demand, 'id' | 'createdAt' | 'lastUpdated' | 'order'>) => void;
  updateDemand: (id: string, updates: Partial<Demand>) => void;
  moveDemand: (demandId: string, toColumnId: string, newOrder: number) => void;
  deleteDemand: (id: string) => void;

  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;

  toggleColumnCollapse: (columnId: string) => void;
  addColumn: (title: string) => void;
  renameColumn: (id: string, title: string) => void;
  deleteColumn: (id: string) => void;
  reorderColumns: (columns: KanbanColumn[]) => void;

  addActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  addComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
}

const DEFAULT_FILTERS: Filters = {
  clientId: '',
  demandTypeId: '',
  assignee: '',
  priority: '',
  tags: [],
  search: '',
  blockedStatus: '',
  dateFrom: '',
  dateTo: '',
};

let idCounter = 100;
const genId = (prefix: string) => `${prefix}${++idCounter}`;

export const useStore = create<AppState>((set, get) => ({
  columns: DEFAULT_COLUMNS,
  demands: SAMPLE_DEMANDS,
  clients: DEFAULT_CLIENTS,
  demandTypes: DEFAULT_DEMAND_TYPES,
  activity: SAMPLE_ACTIVITY,
  comments: [],
  filters: DEFAULT_FILTERS,
  selectedDemandId: null,
  globalSearch: '',

  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  clearFilters: () => set({ filters: DEFAULT_FILTERS }),
  setSelectedDemand: (id) => set({ selectedDemandId: id }),
  setGlobalSearch: (search) => set({ globalSearch: search }),

  addDemand: (demand) => {
    const id = genId('d');
    const n = now();
    const order = get().demands.filter((d) => d.columnId === demand.columnId).length;
    set((s) => ({
      demands: [...s.demands, { ...demand, id, createdAt: n, lastUpdated: n, order }],
      activity: [...s.activity, { id: genId('a'), demandId: id, type: 'created', description: 'Demanda criada', user: 'Sistema', timestamp: n }],
    }));
  },

  updateDemand: (id, updates) => {
    set((s) => ({
      demands: s.demands.map((d) => d.id === id ? { ...d, ...updates, lastUpdated: now() } : d),
    }));
    if (updates.assignee) {
      get().addActivity({ demandId: id, type: 'assigned', description: `Atribuído a ${updates.assignee}`, user: 'Sistema' });
    }
    if (updates.isBlocked === true) {
      get().addActivity({ demandId: id, type: 'blocked', description: `Bloqueado: ${updates.blockerReason || 'Desconhecido'}`, user: updates.blockedBy || 'Sistema' });
    }
    if (updates.isBlocked === false) {
      get().addActivity({ demandId: id, type: 'unblocked', description: 'Desbloqueado', user: 'Sistema' });
    }
  },

  moveDemand: (demandId, toColumnId, newOrder) => {
    const demand = get().demands.find((d) => d.id === demandId);
    if (!demand) return;
    const fromColumnId = demand.columnId;
    const n = now();

    const updates: Partial<Demand> = { columnId: toColumnId, order: newOrder, lastUpdated: n };
    if (toColumnId === 'in_progress' && !demand.startedAt) updates.startedAt = n;
    if (toColumnId === 'done') { updates.finishedAt = n; }
    if (toColumnId === 'canceled' && !demand.cancellationReason) {
      // Will be prompted separately
    }

    set((s) => ({
      demands: s.demands.map((d) => d.id === demandId ? { ...d, ...updates } : d),
    }));

    if (fromColumnId !== toColumnId) {
      const fromCol = get().columns.find((c) => c.id === fromColumnId);
      const toCol = get().columns.find((c) => c.id === toColumnId);
      get().addActivity({
        demandId,
        type: toColumnId === 'done' ? 'completed' : 'moved',
        description: toColumnId === 'done'
          ? `Concluído (movido de ${fromCol?.title || fromColumnId})`
          : `Movido de ${fromCol?.title || fromColumnId} para ${toCol?.title || toColumnId}`,
        user: 'Sistema',
        meta: { from: fromColumnId, to: toColumnId },
      });
    }
  },

  deleteDemand: (id) => set((s) => ({ demands: s.demands.filter((d) => d.id !== id) })),

  addClient: (client) => {
    const id = genId('c');
    set((s) => ({ clients: [...s.clients, { ...client, id, createdAt: now() }] }));
  },

  updateClient: (id, updates) => {
    set((s) => ({ clients: s.clients.map((c) => c.id === id ? { ...c, ...updates } : c) }));
  },

  toggleColumnCollapse: (columnId) => {
    set((s) => ({
      columns: s.columns.map((c) => c.id === columnId ? { ...c, collapsed: !c.collapsed } : c),
    }));
  },

  addColumn: (title) => {
    const id = genId('col');
    const order = get().columns.length;
    set((s) => ({ columns: [...s.columns, { id, title, order, collapsed: false }] }));
  },

  renameColumn: (id, title) => {
    set((s) => ({ columns: s.columns.map((c) => c.id === id ? { ...c, title } : c) }));
  },

  deleteColumn: (id) => {
    set((s) => ({
      columns: s.columns.filter((c) => c.id !== id),
      demands: s.demands.map((d) => d.columnId === id ? { ...d, columnId: 'backlog' } : d),
    }));
  },

  reorderColumns: (columns) => set({ columns }),

  addActivity: (event) => {
    const id = genId('a');
    set((s) => ({ activity: [...s.activity, { ...event, id, timestamp: now() }] }));
  },

  addComment: (comment) => {
    const id = genId('cm');
    set((s) => ({ comments: [...s.comments, { ...comment, id, timestamp: now() }] }));
    get().addActivity({
      demandId: comment.demandId,
      type: 'comment',
      description: `Comentário adicionado por ${comment.user}`,
      user: comment.user,
    });
  },
}));
