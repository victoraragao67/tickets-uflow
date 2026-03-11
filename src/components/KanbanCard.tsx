import { useStore } from '@/store';
import { PRIORITY_CONFIG } from '@/types';
import type { Demand } from '@/types';
import { AlertCircle, Clock, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  demand: Demand;
}

export function KanbanCard({ demand }: Props) {
  const { clients, demandTypes, setSelectedDemand } = useStore();
  const client = clients.find((c) => c.id === demand.clientId);
  const demandType = demandTypes.find((dt) => dt.id === demand.demandTypeId);
  const priorityConfig = PRIORITY_CONFIG[demand.priority];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: demand.id,
    data: { type: 'demand', demand },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg bg-card p-3 cursor-pointer transition-all duration-150 ${
        isDragging
          ? 'card-shadow-drag scale-[1.03] rotate-[2deg] z-50 opacity-90'
          : 'card-shadow hover:card-shadow-hover hover:-translate-y-px'
      }`}
      onClick={() => setSelectedDemand(demand.id)}
    >
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="flex items-start gap-2 mb-2">
        <h3 className="text-sm font-medium leading-snug tracking-tight flex-1 pr-4">{demand.title}</h3>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {demandType && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: `hsl(${demandType.color} / 0.12)`,
              color: `hsl(${demandType.color})`,
            }}
          >
            {demandType.label}
          </span>
        )}
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityConfig.className}`}>
          {priorityConfig.label}
        </span>
        {demand.isBlocked && (
          <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium bg-accent-blocked/15 text-accent-blocked">
            <AlertCircle className="h-3 w-3" /> Blocked
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{client?.name || '—'}</span>
        <div className="flex items-center gap-1.5">
          {demand.estimatedEffort && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground text-tabular">
              <Clock className="h-3 w-3" />{demand.estimatedEffort}
            </span>
          )}
          {demand.assignee && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground" title={demand.assignee}>
              {demand.assignee.split(' ').map(n => n[0]).join('')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
