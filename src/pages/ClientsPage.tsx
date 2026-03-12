import { useStore } from '@/store';
import { Link } from 'react-router-dom';
import { Plus, Mail, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export function ClientsPage() {
  const { clients, demands, addClient } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', company: '', segment: '', contactName: '', email: '', phone: '', notes: '', status: 'active' as const });

  const handleAdd = () => {
    if (!newClient.name.trim()) return;
    addClient(newClient);
    setNewClient({ name: '', company: '', segment: '', contactName: '', email: '', phone: '', notes: '', status: 'active' });
    setShowAdd(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-xl font-semibold heading-tight text-foreground">Clients</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{clients.length} clients</p>
        </div>
        <button
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all duration-150 shadow-sm"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin">
        {showAdd && (
          <div className="rounded-2xl bg-card card-shadow p-5 mb-5">
            <h3 className="text-sm font-semibold mb-4 text-foreground">New Client</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Client Name *" className="h-10 rounded-xl border-border bg-background text-sm focus-visible:ring-ring" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
              <Input placeholder="Company" className="h-10 rounded-xl border-border bg-background text-sm focus-visible:ring-ring" value={newClient.company} onChange={(e) => setNewClient({ ...newClient, company: e.target.value })} />
              <Input placeholder="Segment" className="h-10 rounded-xl border-border bg-background text-sm focus-visible:ring-ring" value={newClient.segment} onChange={(e) => setNewClient({ ...newClient, segment: e.target.value })} />
              <Input placeholder="Contact Name" className="h-10 rounded-xl border-border bg-background text-sm focus-visible:ring-ring" value={newClient.contactName} onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })} />
              <Input placeholder="Email" className="h-10 rounded-xl border-border bg-background text-sm focus-visible:ring-ring" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
              <Input placeholder="Phone" className="h-10 rounded-xl border-border bg-background text-sm focus-visible:ring-ring" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleAdd} className="h-10 px-5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">Create</button>
              <button onClick={() => setShowAdd(false)} className="h-10 px-5 rounded-xl border border-primary text-primary bg-card text-sm font-medium hover:bg-accent transition-colors">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const clientDemands = demands.filter((d) => d.clientId === client.id);
            const openDemands = clientDemands.filter((d) => d.columnId !== 'done' && d.columnId !== 'canceled').length;
            const doneDemands = clientDemands.filter((d) => d.columnId === 'done').length;

            return (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="rounded-2xl bg-card card-shadow p-5 hover:card-shadow-hover hover:-translate-y-0.5 transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold heading-tight text-foreground">{client.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[12px] text-muted-foreground">{client.company}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    client.status === 'active' ? 'bg-accent-low/12 text-accent-low' : 'bg-muted text-muted-foreground'
                  }`}>
                    {client.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[12px] text-muted-foreground mb-3">
                  {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <div className="text-[11px]">
                    <span className="text-muted-foreground">Open </span>
                    <span className="font-semibold text-tabular text-foreground">{openDemands}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="text-muted-foreground">Done </span>
                    <span className="font-semibold text-tabular text-foreground">{doneDemands}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="text-muted-foreground">Total </span>
                    <span className="font-semibold text-tabular text-foreground">{clientDemands.length}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
