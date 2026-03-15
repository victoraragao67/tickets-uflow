import { useStore } from '@/store';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { ClientFormModal } from '@/components/ClientFormModal';
import { CLIENT_PLAN_CONFIG, CLIENT_HEALTH_CONFIG, CLIENT_RISK_CONFIG } from '@/types';
import { differenceInHours, parseISO } from 'date-fns';

type SortKey = 'name' | 'company' | 'segment' | 'accountManager' | 'status' | 'plan' | 'healthScore' | 'riskLevel' | 'open' | 'done' | 'avgResolution';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

export function ClientsPage() {
  const { clients, demands, addClient, updateClient } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<typeof clients[0] | null>(null);

  const clientStats = useMemo(() => {
    const map: Record<string, { open: number; done: number; avgResolution: number | null }> = {};
    for (const c of clients) {
      const cDemands = demands.filter((d) => d.clientId === c.id);
      const open = cDemands.filter((d) => d.columnId !== 'done' && d.columnId !== 'canceled').length;
      const done = cDemands.filter((d) => d.columnId === 'done').length;
      const completed = cDemands.filter((d) => d.startedAt && d.finishedAt);
      const avg = completed.length
        ? completed.reduce((s, d) => s + differenceInHours(parseISO(d.finishedAt!), parseISO(d.startedAt!)), 0) / completed.length
        : null;
      map[c.id] = { open, done, avgResolution: avg };
    }
    return map;
  }, [clients, demands]);

  const managers = useMemo(() => {
    const set = new Set(clients.map((c) => c.accountManager).filter(Boolean));
    return Array.from(set).sort();
  }, [clients]);

  const filtered = useMemo(() => {
    let list = clients;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter);
    if (planFilter !== 'all') list = list.filter((c) => c.plan === planFilter);
    if (healthFilter !== 'all') list = list.filter((c) => c.healthScore === healthFilter);
    if (riskFilter !== 'all') list = list.filter((c) => c.riskLevel === riskFilter);
    if (managerFilter !== 'all') list = list.filter((c) => c.accountManager === managerFilter);

    list = [...list].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === 'open') { av = clientStats[a.id]?.open ?? 0; bv = clientStats[b.id]?.open ?? 0; }
      else if (sortKey === 'done') { av = clientStats[a.id]?.done ?? 0; bv = clientStats[b.id]?.done ?? 0; }
      else if (sortKey === 'avgResolution') { av = clientStats[a.id]?.avgResolution ?? 9999; bv = clientStats[b.id]?.avgResolution ?? 9999; }
      else { av = (a[sortKey] || '').toLowerCase(); bv = (b[sortKey] || '').toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [clients, search, statusFilter, planFilter, healthFilter, riskFilter, managerFilter, sortKey, sortDir, clientStats]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-0 group-hover:opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  const handleSave = (data: Parameters<typeof addClient>[0]) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
    } else {
      addClient(data);
    }
    setEditingClient(null);
  };

  const formatAvg = (h: number | null) => {
    if (h === null) return '—';
    if (h < 24) return `${h.toFixed(0)}h`;
    return `${(h / 24).toFixed(1)}d`;
  };

  const resetPage = () => setPage(0);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-xl font-semibold heading-tight text-foreground">Clientes</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{clients.length} clientes cadastrados</p>
        </div>
        <button
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all duration-150 shadow-sm"
          onClick={() => { setEditingClient(null); setFormOpen(true); }}
        >
          <Plus className="h-4 w-4" /> Novo Cliente
        </button>
      </header>

      {/* Filters */}
      <div className="flex items-center gap-3 px-8 pb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="h-10 pl-9 rounded-xl"
            placeholder="Buscar por nome ou empresa…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
          <SelectTrigger className="h-10 w-[130px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); resetPage(); }}>
          <SelectTrigger className="h-10 w-[140px] rounded-xl"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Planos</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={healthFilter} onValueChange={(v) => { setHealthFilter(v); resetPage(); }}>
          <SelectTrigger className="h-10 w-[130px] rounded-xl"><SelectValue placeholder="Saúde" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="healthy">Saudável</SelectItem>
            <SelectItem value="attention">Atenção</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); resetPage(); }}>
          <SelectTrigger className="h-10 w-[120px] rounded-xl"><SelectValue placeholder="Risco" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="low">Baixo</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="high">Alto</SelectItem>
          </SelectContent>
        </Select>
        <Select value={managerFilter} onValueChange={(v) => { setManagerFilter(v); resetPage(); }}>
          <SelectTrigger className="h-10 w-[160px] rounded-xl"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {managers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-8 pb-4 scrollbar-thin">
        <div className="rounded-2xl bg-card card-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {([
                  ['name', 'Nome'],
                  ['company', 'Empresa'],
                  ['plan', 'Plano'],
                  ['healthScore', 'Saúde'],
                  ['riskLevel', 'Risco'],
                  ['accountManager', 'Responsável'],
                  ['open', 'Abertos'],
                  ['done', 'Concluídos'],
                  ['avgResolution', 'Tempo Médio'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <TableHead key={key}>
                    <button onClick={() => toggleSort(key)} className="group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                      {label} <SortIcon col={key} />
                    </button>
                  </TableHead>
                ))}
                <TableHead className="w-[100px]"><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-12">Nenhum cliente encontrado.</TableCell>
                </TableRow>
              )}
              {paginated.map((client) => {
                const stats = clientStats[client.id] || { open: 0, done: 0, avgResolution: null };
                const planCfg = CLIENT_PLAN_CONFIG[client.plan];
                const healthCfg = CLIENT_HEALTH_CONFIG[client.healthScore];
                const riskCfg = CLIENT_RISK_CONFIG[client.riskLevel];
                return (
                  <TableRow key={client.id} className="group">
                    <TableCell>
                      <div>
                        <span className="font-medium text-foreground">{client.name}</span>
                        <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          client.status === 'active' ? 'bg-accent-low/12 text-accent-low' : 'bg-muted text-muted-foreground'
                        }`}>
                          {client.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.company}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${planCfg.className}`}>
                        {planCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${healthCfg.className}`}>
                        {healthCfg.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${riskCfg.className}`}>
                        {riskCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.accountManager || '—'}</TableCell>
                    <TableCell className="text-tabular font-semibold text-foreground">{stats.open}</TableCell>
                    <TableCell className="text-tabular font-semibold text-foreground">{stats.done}</TableCell>
                    <TableCell className="text-tabular text-muted-foreground">{formatAvg(stats.avgResolution)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/clients/${client.id}`} className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-accent transition-colors" title="Ver detalhes">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <button onClick={() => { setEditingClient(client); setFormOpen(true); }} className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-accent transition-colors" title="Editar">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground px-2">Página {page + 1} de {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <ClientFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingClient(null); }}
        onSave={handleSave}
        client={editingClient}
      />
    </div>
  );
}
