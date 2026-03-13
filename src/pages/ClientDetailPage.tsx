import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store';
import { ArrowLeft, Mail, Phone, Building2, User, Globe, AlertCircle, Pencil, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { PRIORITY_CONFIG } from '@/types';
import { format, differenceInHours, parseISO } from 'date-fns';
import { useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DemandDetailModal } from '@/components/DemandDetailModal';
import { ClientFormModal } from '@/components/ClientFormModal';

type TabId = 'info' | 'demands' | 'metrics' | 'history' | 'notes';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const { clients, demands, demandTypes, columns, activity, clientHistory, updateClient, setSelectedDemand, selectedDemandId } = store;
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [editOpen, setEditOpen] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatus, setTicketStatus] = useState('all');

  const client = clients.find((c) => c.id === id);
  const clientDemands = useMemo(() => client ? demands.filter((d) => d.clientId === client.id) : [], [client, demands]);

  const avgCycleTime = useMemo(() => {
    const completed = clientDemands.filter((d) => d.startedAt && d.finishedAt);
    if (!completed.length) return null;
    const total = completed.reduce((sum, d) => sum + differenceInHours(parseISO(d.finishedAt!), parseISO(d.startedAt!)), 0);
    return total / completed.length;
  }, [clientDemands]);

  const filteredDemands = useMemo(() => {
    let list = clientDemands;
    if (ticketSearch) {
      const q = ticketSearch.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q));
    }
    if (ticketStatus === 'open') list = list.filter((d) => d.columnId !== 'done' && d.columnId !== 'canceled');
    if (ticketStatus === 'done') list = list.filter((d) => d.columnId === 'done');
    if (ticketStatus === 'blocked') list = list.filter((d) => d.isBlocked);
    return list;
  }, [clientDemands, ticketSearch, ticketStatus]);

  if (!client) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
      </div>
    );
  }

  const openDemands = clientDemands.filter((d) => d.columnId !== 'done' && d.columnId !== 'canceled');
  const inProgressDemands = clientDemands.filter((d) => d.columnId === 'in_progress');
  const doneDemands = clientDemands.filter((d) => d.columnId === 'done');
  const blockedDemands = clientDemands.filter((d) => d.isBlocked);

  const history = clientHistory
    .filter((h) => h.clientId === client.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const demandCreationEvents = clientDemands.map((d) => ({
    id: `dh-${d.id}`,
    clientId: client.id,
    type: 'updated' as const,
    description: `Ticket criado: "${d.title}"`,
    user: 'Sistema',
    timestamp: d.createdAt,
  }));

  const fullHistory = [...history, ...demandCreationEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatCycleTime = (h: number | null) => {
    if (h === null) return '—';
    if (h < 24) return `${h.toFixed(1)}h`;
    return `${(h / 24).toFixed(1)}d`;
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'info', label: 'Informações' },
    { id: 'demands', label: `Tickets (${clientDemands.length})` },
    { id: 'metrics', label: 'Métricas' },
    { id: 'history', label: 'Histórico' },
    { id: 'notes', label: 'Observações' },
  ];

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 px-8 py-5">
        <Link to="/clients" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold heading-tight text-foreground">{client.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
              client.status === 'active' ? 'bg-accent-low/12 text-accent-low' : 'bg-muted text-muted-foreground'
            }`}>
              {client.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground mt-0.5">{client.company} · {client.segment}</p>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border px-8 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 pb-8 scrollbar-thin">
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
            <div className="rounded-2xl bg-card card-shadow p-6 space-y-4">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dados do Cliente</h3>
              <div className="space-y-3 text-sm">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Empresa" value={client.company} />
                <InfoRow icon={<User className="h-4 w-4" />} label="Segmento" value={client.segment} />
                <InfoRow icon={<User className="h-4 w-4" />} label="Responsável Interno" value={client.accountManager} />
              </div>
            </div>
            <div className="rounded-2xl bg-card card-shadow p-6 space-y-4">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contato</h3>
              <div className="space-y-3 text-sm">
                <InfoRow icon={<User className="h-4 w-4" />} label="Nome do Contato" value={client.contactName} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={client.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={client.phone} />
                <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={client.website} isLink />
              </div>
            </div>
            <div className="rounded-2xl bg-card card-shadow p-6 lg:col-span-2">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resumo de Tickets</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard icon={<AlertCircle className="h-5 w-5 text-accent-high" />} label="Abertos" value={openDemands.length} />
                <StatCard icon={<Loader2 className="h-5 w-5 text-primary" />} label="Em Progresso" value={inProgressDemands.length} />
                <StatCard icon={<CheckCircle className="h-5 w-5 text-accent-low" />} label="Concluídos" value={doneDemands.length} />
                <StatCard icon={<Clock className="h-5 w-5 text-accent-blocked" />} label="Bloqueados" value={blockedDemands.length} highlight={blockedDemands.length > 0} />
              </div>
            </div>
          </div>
        )}

        {/* DEMANDS TAB */}
        {activeTab === 'demands' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Input
                  className="h-9 rounded-xl pl-3 text-sm"
                  placeholder="Buscar ticket…"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'open', label: 'Abertos' },
                  { id: 'done', label: 'Concluídos' },
                  { id: 'blocked', label: 'Bloqueados' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTicketStatus(f.id)}
                    className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
                      ticketStatus === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredDemands.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhum ticket encontrado.</p>}
              {filteredDemands.map((d) => {
                const dt = demandTypes.find((t) => t.id === d.demandTypeId);
                const col = columns.find((c) => c.id === d.columnId);
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDemand(d.id)}
                    className="w-full flex items-center justify-between rounded-xl bg-card card-shadow p-3.5 hover:card-shadow-hover hover:-translate-y-0.5 transition-all duration-150 text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-medium text-foreground">{d.title}</h4>
                      {dt && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: `hsl(${dt.color} / 0.1)`, color: `hsl(${dt.color})` }}>
                          {dt.label}
                        </span>
                      )}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_CONFIG[d.priority].className}`}>
                        {PRIORITY_CONFIG[d.priority].label}
                      </span>
                      {d.isBlocked && (
                        <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-accent-blocked/12 text-accent-blocked">
                          <AlertCircle className="h-3 w-3" /> Bloqueado
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 shrink-0">{col?.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* METRICS TAB */}
        {activeTab === 'metrics' && (
          <div className="max-w-3xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricCard label="Total de Tickets" value={clientDemands.length} />
              <MetricCard label="Tickets Abertos" value={openDemands.length} />
              <MetricCard label="Em Progresso" value={inProgressDemands.length} />
              <MetricCard label="Concluídos" value={doneDemands.length} />
              <MetricCard label="Bloqueados" value={blockedDemands.length} highlight={blockedDemands.length > 0} />
              <MetricCard label="Tempo Médio de Resolução" value={formatCycleTime(avgCycleTime)} />
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="max-w-3xl space-y-1">
            {fullHistory.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhum evento no histórico.</p>}
            {fullHistory.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors">
                <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                  event.type === 'created' ? 'bg-accent-low' :
                  event.type === 'archived' ? 'bg-accent-blocked' :
                  event.type === 'reactivated' ? 'bg-primary' :
                  'bg-muted-foreground/40'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{event.description}</p>
                  <p className="text-[11px] text-muted-foreground text-tabular mt-0.5">
                    {format(new Date(event.timestamp), 'dd/MM/yyyy, HH:mm')} · {event.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="max-w-3xl">
            <Textarea
              className="min-h-[240px] rounded-xl border-border bg-background text-sm resize-none focus-visible:ring-ring"
              value={client.notes}
              onChange={(e) => updateClient(client.id, { notes: e.target.value })}
              placeholder="Adicione observações sobre este cliente…"
            />
          </div>
        )}
      </div>

      {selectedDemandId && (
        <DemandDetailModal demandId={selectedDemandId} onClose={() => setSelectedDemand(null)} />
      )}

      <ClientFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={(data) => updateClient(client.id, data)}
        client={client}
      />
    </div>
  );
}

function InfoRow({ icon, label, value, isLink }: { icon: React.ReactNode; label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      {isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{value}</a>
      ) : (
        <span className="text-foreground truncate">{value || '—'}</span>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl bg-background border border-border p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
        <div className={`text-xl font-bold text-tabular ${highlight ? 'text-accent-blocked' : 'text-foreground'}`}>{value}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-2xl bg-card card-shadow p-5">
      <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
      <div className={`text-2xl font-bold text-tabular mt-1 ${highlight ? 'text-accent-blocked' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}
