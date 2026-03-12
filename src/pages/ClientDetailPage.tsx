import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store';
import { ArrowLeft, Mail, Phone, Building2, User, AlertCircle } from 'lucide-react';
import { PRIORITY_CONFIG } from '@/types';
import { format, differenceInHours, parseISO } from 'date-fns';
import { useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { DemandDetailModal } from '@/components/DemandDetailModal';

type TabId = 'demands' | 'activity' | 'notes';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { clients, demands, demandTypes, columns, activity, updateClient, setSelectedDemand, selectedDemandId } = useStore();
  const [activeTab, setActiveTab] = useState<TabId>('demands');
  const client = clients.find((c) => c.id === id);

  const clientDemands = useMemo(() => client ? demands.filter((d) => d.clientId === client.id) : [], [client, demands]);

  const avgCycleTime = useMemo(() => {
    const completed = clientDemands.filter((d) => d.startedAt && d.finishedAt);
    if (!completed.length) return null;
    const total = completed.reduce((sum, d) => sum + differenceInHours(parseISO(d.finishedAt!), parseISO(d.startedAt!)), 0);
    return total / completed.length;
  }, [clientDemands]);

  if (!client) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Cliente não encontrado.</p>
      </div>
    );
  }

  const openDemands = clientDemands.filter((d) => d.columnId !== 'done' && d.columnId !== 'canceled');
  const doneDemands = clientDemands.filter((d) => d.columnId === 'done');
  const blockedDemands = clientDemands.filter((d) => d.isBlocked);

  const clientActivity = activity
    .filter((a) => clientDemands.some((d) => d.id === a.demandId))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30);

  const formatCycleTime = (h: number | null) => {
    if (h === null) return '—';
    if (h < 24) return `${h.toFixed(1)}h`;
    return `${(h / 24).toFixed(1)}d`;
  };

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
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-card card-shadow p-5 space-y-3">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contato</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5 text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{client.contactName || '—'}</div>
                <div className="flex items-center gap-2.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{client.email || '—'}</div>
                <div className="flex items-center gap-2.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{client.phone || '—'}</div>
                <div className="flex items-center gap-2.5 text-muted-foreground"><User className="h-3.5 w-3.5" />{client.accountManager || '—'}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-card card-shadow p-5 space-y-3">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Métricas</h3>
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Total" value={clientDemands.length} />
                <Stat label="Abertos" value={openDemands.length} />
                <Stat label="Concluídos" value={doneDemands.length} />
                <Stat label="Bloqueados" value={blockedDemands.length} highlight={blockedDemands.length > 0} />
                <Stat label="Cycle Time Médio" value={formatCycleTime(avgCycleTime)} />
                <Stat label="Status" value={client.status === 'active' ? 'Ativo' : 'Inativo'} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-2 space-y-4">
            <div className="flex border-b border-border gap-1">
              {([
                { id: 'demands' as TabId, label: 'Demandas', count: clientDemands.length },
                { id: 'activity' as TabId, label: 'Atividades', count: clientActivity.length },
                { id: 'notes' as TabId, label: 'Observações' },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.count != null && <span className="text-[10px] bg-accent text-accent-foreground rounded-full px-1.5 py-0.5">{tab.count}</span>}
                </button>
              ))}
            </div>

            {activeTab === 'demands' && (
              <div className="space-y-2.5">
                {clientDemands.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma demanda ainda.</p>}
                {clientDemands.map((d) => {
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
                      <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">{col?.title}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-1">
                {clientActivity.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p>}
                {clientActivity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-accent/50 transition-colors">
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      event.type === 'blocked' ? 'bg-accent-blocked' :
                      event.type === 'completed' ? 'bg-accent-low' :
                      event.type === 'moved' ? 'bg-primary' :
                      'bg-muted-foreground/40'
                    }`} />
                    <div>
                      <p className="text-sm text-foreground">{event.description}</p>
                      <p className="text-[11px] text-muted-foreground text-tabular">{format(new Date(event.timestamp), 'dd/MM, HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <Textarea
                  className="min-h-[200px] rounded-xl border-border bg-background text-sm resize-none focus-visible:ring-ring"
                  value={client.notes}
                  onChange={(e) => updateClient(client.id, { notes: e.target.value })}
                  placeholder="Adicione observações sobre este cliente…"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDemandId && (
        <DemandDetailModal
          demandId={selectedDemandId}
          onClose={() => setSelectedDemand(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
      <div className={`text-lg font-bold text-tabular ${highlight ? 'text-accent-blocked' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}