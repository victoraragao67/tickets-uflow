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
  const client = clients.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState<TabId>('demands');

  if (!client) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Client not found.</p>
      </div>
    );
  }

  const clientDemands = demands.filter((d) => d.clientId === client.id);
  const openDemands = clientDemands.filter((d) => d.columnId !== 'done' && d.columnId !== 'canceled');
  const doneDemands = clientDemands.filter((d) => d.columnId === 'done');
  const blockedDemands = clientDemands.filter((d) => d.isBlocked);

  const avgCycleTime = useMemo(() => {
    const completed = clientDemands.filter((d) => d.startedAt && d.finishedAt);
    if (!completed.length) return null;
    const total = completed.reduce((sum, d) => sum + differenceInHours(parseISO(d.finishedAt!), parseISO(d.startedAt!)), 0);
    return total / completed.length;
  }, [clientDemands]);

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
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link to="/clients" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium heading-tight">{client.name}</h1>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
              client.status === 'active' ? 'bg-accent-low/15 text-accent-low' : 'bg-muted text-muted-foreground'
            }`}>
              {client.status}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">{client.company} · {client.segment}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="space-y-4">
            {/* Contact */}
            <div className="rounded-lg bg-card card-shadow p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Contact</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{client.contactName || '—'}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{client.email || '—'}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{client.phone || '—'}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5" />{client.accountManager || '—'}</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="rounded-lg bg-card card-shadow p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Total" value={clientDemands.length} />
                <Stat label="Open" value={openDemands.length} />
                <Stat label="Completed" value={doneDemands.length} />
                <Stat label="Blocked" value={blockedDemands.length} highlight={blockedDemands.length > 0} />
                <Stat label="Avg Cycle" value={formatCycleTime(avgCycleTime)} />
                <Stat label="Status" value={client.status} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-border gap-4">
              {([
                { id: 'demands' as TabId, label: 'Demands', count: clientDemands.length },
                { id: 'activity' as TabId, label: 'Activity', count: clientActivity.length },
                { id: 'notes' as TabId, label: 'Notes' },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.count != null && <span className="text-[10px] bg-muted rounded-full px-1.5">{tab.count}</span>}
                </button>
              ))}
            </div>

            {activeTab === 'demands' && (
              <div className="space-y-2">
                {clientDemands.length === 0 && <p className="text-sm text-muted-foreground">No demands yet.</p>}
                {clientDemands.map((d) => {
                  const dt = demandTypes.find((t) => t.id === d.demandTypeId);
                  const col = columns.find((c) => c.id === d.columnId);
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDemand(d.id)}
                      className="w-full flex items-center justify-between rounded-lg bg-card card-shadow p-3 hover:card-shadow-hover transition-all duration-150 text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium">{d.title}</h4>
                        {dt && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: `hsl(${dt.color} / 0.12)`, color: `hsl(${dt.color})` }}>
                            {dt.label}
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_CONFIG[d.priority].className}`}>
                          {PRIORITY_CONFIG[d.priority].label}
                        </span>
                        {d.isBlocked && (
                          <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-accent-blocked/15 text-accent-blocked">
                            <AlertCircle className="h-3 w-3" /> Blocked
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{col?.title}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-2">
                {clientActivity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
                {clientActivity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      event.type === 'blocked' ? 'bg-accent-blocked' :
                      event.type === 'completed' ? 'bg-accent-low' :
                      event.type === 'moved' ? 'bg-primary' :
                      'bg-muted-foreground/40'
                    }`} />
                    <div>
                      <p className="text-sm">{event.description}</p>
                      <p className="text-[11px] text-muted-foreground text-tabular">{format(new Date(event.timestamp), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <Textarea
                  className="min-h-[200px] bg-input border-none text-sm resize-none"
                  value={client.notes}
                  onChange={(e) => updateClient(client.id, { notes: e.target.value })}
                  placeholder="Add notes about this client…"
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
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium text-tabular ${highlight ? 'text-accent-blocked' : ''}`}>{value}</div>
    </div>
  );
}
