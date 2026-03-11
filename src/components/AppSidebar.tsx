import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Search, Settings } from 'lucide-react';
import { useStore } from '@/store';
import { useState, useEffect, useRef } from 'react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Board' },
  { to: '/clients', icon: Users, label: 'Clients' },
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
      <aside className="flex h-screen w-16 flex-col items-center border-r border-border bg-sidebar py-4 gap-1">
        <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-semibold text-sm">
          D
        </div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 ${
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
              title={label}
            >
              <Icon className="h-[18px] w-[18px]" />
            </Link>
          );
        })}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors duration-150"
          title="Search (⌘K)"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
      </aside>

      {/* Global Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-xl bg-card card-shadow p-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search demands, clients, tags…"
                className="flex-1 h-11 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              <kbd className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
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
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent rounded-md transition-colors"
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
              className="block px-3 py-2 text-left text-sm hover:bg-accent rounded-md transition-colors"
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
