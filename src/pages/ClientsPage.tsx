import { useStore } from '@/store';
import { Link } from 'react-router-dom';
import { Plus, Mail, Phone, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-medium heading-tight">Clients</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">{clients.length} clients</p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {showAdd && (
          <div className="rounded-xl bg-card card-shadow p-4 mb-4">
            <h3 className="text-sm font-medium mb-3">New Client</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Client Name *" className="h-9 bg-input border-none text-sm" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
              <Input placeholder="Company" className="h-9 bg-input border-none text-sm" value={newClient.company} onChange={(e) => setNewClient({ ...newClient, company: e.target.value })} />
              <Input placeholder="Segment" className="h-9 bg-input border-none text-sm" value={newClient.segment} onChange={(e) => setNewClient({ ...newClient, segment: e.target.value })} />
              <Input placeholder="Contact Name" className="h-9 bg-input border-none text-sm" value={newClient.contactName} onChange={(e) => setNewClient({ ...newClient, contactName: e.target.value })} />
              <Input placeholder="Email" className="h-9 bg-input border-none text-sm" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
              <Input placeholder="Phone" className="h-9 bg-input border-none text-sm" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleAdd} className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Create</button>
              <button onClick={() => setShowAdd(false)} className="h-9 px-3 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const clientDemands = demands.filter((d) => d.clientId === client.id);
            const openDemands = clientDemands.filter((d) => d.columnId !== 'done' && d.columnId !== 'canceled').length;
            const doneDemands = clientDemands.filter((d) => d.columnId === 'done').length;

            return (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="rounded-lg bg-card card-shadow p-4 hover:card-shadow-hover hover:-translate-y-px transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium heading-tight">{client.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[12px] text-muted-foreground">{client.company}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    client.status === 'active' ? 'bg-accent-low/15 text-accent-low' : 'bg-muted text-muted-foreground'
                  }`}>
                    {client.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[12px] text-muted-foreground mb-3">
                  {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="text-[11px]">
                    <span className="text-muted-foreground">Open </span>
                    <span className="font-medium text-tabular">{openDemands}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="text-muted-foreground">Done </span>
                    <span className="font-medium text-tabular">{doneDemands}</span>
                  </div>
                  <div className="text-[11px]">
                    <span className="text-muted-foreground">Total </span>
                    <span className="font-medium text-tabular">{clientDemands.length}</span>
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
