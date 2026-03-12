import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Search, BarChart3 } from 'lucide-react';
import { useStore } from '@/store';
import { useState, useEffect, useRef } from 'react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/metrics', icon: BarChart3, label: 'Métricas' },
];

export function AppSidebar() {
  const location = useLocation();
  const { globalSearch, setGlobalSearch } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <>
      <aside className="flex h-screen w-[220px] flex-col border-r border-sidebar-border bg-sidebar py-6 px-3 gap-1 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground font-bold text-sm">
            U
          </div>
          <span className="text-[15px] font-semibold heading-tight text-sidebar-foreground">Umode</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150 w-full"
          >
            <Search className="h-[18px] w-[18px]" />
            <span>Buscar</span>
            <kbd className="ml-auto text-[10px] text-sidebar-muted bg-sidebar-border px-1.5 py-0.5 rounded-md">⌘K</kbd>
          </button>
        </nav>
      </aside>

      {/* Global Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-2xl bg-card card-shadow-hover p-1 border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar demandas, clientes, tags…"
                className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              <kbd className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">ESC</kbd>
            </div>
            {globalSearch && <SearchResults onClose={() => setSearchOpen(false)} />}
          </div>
        </div>
      )}
    </>
  );
}

function SearchResults({ onClose }: { onClose: () => void }) {
  const { demands, clients, globalSearch, setSelectedDemand } = useStore();
  const q = globalSearch.toLowerCase();

  const matchedDemands = demands.filter(
    (d) => d.title.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q))
  ).slice(0, 5);

  const matchedClients = clients.filter(
    (c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
  ).slice(0, 3);

  if (!matchedDemands.length && !matchedClients.length) {
    return <div className="px-3 py-4 text-sm text-muted-foreground">No results found.</div>;
  }

  return (
    <div className="border-t border-border py-1">
      {matchedDemands.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Demands</div>
          {matchedDemands.map((d) => (
            <button
              key={d.id}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent rounded-lg transition-colors"
              onClick={() => { setSelectedDemand(d.id); onClose(); }}
            >
              {d.title}
            </button>
          ))}
        </div>
      )}
      {matchedClients.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Clients</div>
          {matchedClients.map((c) => (
            <Link
              key={c.id}
              to={`/clients/${c.id}`}
              className="block px-3 py-2 text-left text-sm hover:bg-accent rounded-lg transition-colors"
              onClick={onClose}
            >
              {c.name} — {c.company}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
