import { useStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

export function KanbanFilters() {
  const { filters, setFilters, clearFilters, clients, demandTypes } = useStore();
  const assignees = [...new Set(useStore.getState().demands.map((d) => d.assignee).filter(Boolean))];
  const hasFilters = filters.clientId || filters.demandTypeId || filters.assignee || filters.priority || filters.search;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        placeholder="Search…"
        className="h-9 w-48 bg-input border-none text-sm"
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
      />
      <Select value={filters.clientId || "all"} onValueChange={(v) => setFilters({ clientId: v === 'all' ? '' : v })}>
        <SelectTrigger className="h-9 w-36 bg-input border-none text-sm">
          <SelectValue placeholder="Client" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Clients</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.demandTypeId || "all"} onValueChange={(v) => setFilters({ demandTypeId: v === 'all' ? '' : v })}>
        <SelectTrigger className="h-9 w-36 bg-input border-none text-sm">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {demandTypes.map((dt) => (
            <SelectItem key={dt.id} value={dt.id}>{dt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.priority || "all"} onValueChange={(v) => setFilters({ priority: v === 'all' ? '' : v })}>
        <SelectTrigger className="h-9 w-32 bg-input border-none text-sm">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.assignee || "all"} onValueChange={(v) => setFilters({ assignee: v === 'all' ? '' : v })}>
        <SelectTrigger className="h-9 w-36 bg-input border-none text-sm">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {assignees.map((a) => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
}
