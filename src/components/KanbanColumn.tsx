import { useStore } from '@/store';
import type { KanbanColumn as ColumnType, Demand } from '@/types';
import { KanbanCard } from './KanbanCard';
import { ChevronRight, Plus, MoreHorizontal } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';

interface Props {
  column: ColumnType;
  demands: Demand[];
}

const NEW_DEMAND_DEFAULTS = {
  description: '',
  expectedResult: '',
  clientId: '',
  demandTypeId: 'dt1',
  priority: 'medium' as const,
  assignee: '',
  watchers: [] as string[],
  tags: [] as string[],
  startedAt: null,
  finishedAt: null,
  blockedAt: null,
  estimatedEffort: '',
  actualEffort: '',
  isBlocked: false,
  blockerReason: '',
  blockedBy: '',
  cancellationReason: '',
  notes: '',
  attachments: [] as string[],
};

export function KanbanColumn({ column, demands }: Props) {
  const { toggleColumnCollapse, addDemand } = useStore();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  });

  const handleQuickCreate = () => {
    if (!newTitle.trim()) { setCreating(false); return; }
    addDemand({ ...NEW_DEMAND_DEFAULTS, title: newTitle.trim(), columnId: column.id });
    setNewTitle('');
    setCreating(false);
  };

  if (column.collapsed) {
    return (
      <button
        onClick={() => toggleColumnCollapse(column.id)}
        className="flex h-full min-h-[400px] w-10 flex-col items-center gap-2 rounded-2xl bg-card card-shadow pt-4 transition-all duration-200 hover:card-shadow-hover"
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-[11px] font-medium text-muted-foreground [writing-mode:vertical-lr] rotate-180">
          {column.title}
        </span>
        <span className="text-[11px] text-muted-foreground text-tabular">{demands.length}</span>
      </button>
    );
  }

  return (
    <div className="flex min-w-[300px] max-w-[340px] flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <button
          onClick={() => toggleColumnCollapse(column.id)}
          className="flex items-center gap-2 group/header"
        >
          <h2 className="text-[13px] font-semibold text-foreground heading-tight">{column.title}</h2>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground text-tabular px-1.5">
            {demands.length}
          </span>
        </button>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCreating(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2.5 rounded-2xl p-2.5 min-h-[120px] transition-colors duration-150 ${
          isOver ? 'bg-accent/80' : 'bg-muted/40'
        }`}
      >
        {creating && (
          <div className="rounded-xl bg-card card-shadow p-3">
            <input
              autoFocus
              placeholder="Demand title…"
              className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickCreate();
                if (e.key === 'Escape') { setCreating(false); setNewTitle(''); }
              }}
              onBlur={handleQuickCreate}
            />
          </div>
        )}
        <SortableContext items={demands.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {demands.map((demand) => (
            <KanbanCard key={demand.id} demand={demand} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
