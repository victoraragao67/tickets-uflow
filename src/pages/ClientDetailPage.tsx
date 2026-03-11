import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store';
import { ArrowLeft, Mail, Phone, Building2, MapPin } from 'lucide-react';
import { PRIORITY_CONFIG } from '@/types';
import { format } from 'date-fns';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { clients, demands, demandTypes, columns, activity, setSelectedDemand } = useStore();
  const client = clients.find((c) => c.id === id);

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
  const clientActivity = activity
    .filter((a) => clientDemands.some((d) => d.id === a.demandId))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link to="/clients" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-medium heading-tight">{client.name}</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">{client.company} · {client.segment}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-3 gap-6">
          {/* Left - Info */}
          <div className="space-y-4">
            <div className="rounded-lg bg-card card-shadow p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Contact</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{client.contactName || '—'}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{client.email || '—'}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{client.phone || '—'}</div>
              </div>
            </div>

            <div className="rounded-lg bg-card card-shadow p-4 space-y-3">
              <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Open" value={openDemands.length} />
                <Stat label="Done" value={doneDemands.length} />
                <Stat label="Total" value={clientDemands.length} />
                <Stat label="Status" value={client.status} />
              </div>
            </div>

            {client.notes && (
              <div className="rounded-lg bg-card card-shadow p-4">
                <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Right - Demands + Activity */}
          <div className="col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-medium heading-tight mb-3">Demands ({clientDemands.length})</h3>
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
                      <div className="flex items-center gap-2">
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
                      </div>
                      <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{col?.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium heading-tight mb-3">Activity</h3>
              <div className="space-y-2">
                {clientActivity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
                {clientActivity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <div>
                      <p className="text-sm">{event.description}</p>
                      <p className="text-[11px] text-muted-foreground text-tabular">{format(new Date(event.timestamp), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-tabular">{value}</div>
    </div>
  );
}
