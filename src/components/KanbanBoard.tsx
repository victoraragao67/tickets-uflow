import { useStore } from '@/store';
import { KanbanColumn } from './KanbanColumn';
import { KanbanFilters } from './KanbanFilters';
import { DemandDetailModal } from './DemandDetailModal';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import type { Demand } from '@/types';
import { KanbanCard } from './KanbanCard';
import { Plus } from 'lucide-react';

const NEW_DEMAND_DEFAULTS = {
  title: 'New Demand',
  description: '',
  expectedResult: '',
  clientId: '',
  demandTypeId: 'dt1',
  priority: 'medium' as const,
  assignee: '',
  watchers: [] as string[],
  tags: [] as string[],
  columnId: 'backlog',
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

export function KanbanBoard() {
  const { columns, demands, filters, selectedDemandId, setSelectedDemand, addDemand, moveDemand } = useStore();
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredDemands = demands.filter((d) => {
    if (filters.search && !d.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.clientId && d.clientId !== filters.clientId) return false;
    if (filters.demandTypeId && d.demandTypeId !== filters.demandTypeId) return false;
    if (filters.priority && d.priority !== filters.priority) return false;
    if (filters.assignee && d.assignee !== filters.assignee) return false;
    if (filters.blockedStatus === 'blocked' && !d.isBlocked) return false;
    if (filters.blockedStatus === 'not_blocked' && d.isBlocked) return false;
    if (filters.dateFrom && d.createdAt < filters.dateFrom) return false;
    if (filters.dateTo && d.createdAt > filters.dateTo) return false;
    return true;
  });

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const demand = demands.find((d) => d.id === event.active.id);
    if (demand) setActiveDemand(demand);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeDemand = demands.find((d) => d.id === activeId);
    if (!activeDemand) return;
    const overColumn = columns.find((c) => c.id === overId);
    const overDemand = demands.find((d) => d.id === overId);
    const targetColumnId = overColumn?.id || overDemand?.columnId;
    if (targetColumnId && activeDemand.columnId !== targetColumnId) {
      moveDemand(activeId, targetColumnId, 0);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDemand(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const overColumn = columns.find((c) => c.id === overId);
    const overDemand = demands.find((d) => d.id === overId);
    const targetColumnId = overColumn?.id || overDemand?.columnId;
    if (targetColumnId) {
      const colDemands = demands.filter((d) => d.columnId === targetColumnId && d.id !== activeId);
      const overIndex = overDemand ? colDemands.findIndex((d) => d.id === overId) : colDemands.length;
      moveDemand(activeId, targetColumnId, Math.max(0, overIndex));
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-xl font-semibold heading-tight text-foreground">Demandas</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{filteredDemands.length} demandas em {columns.length} colunas</p>
        </div>
        <button
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all duration-150 shadow-sm"
          onClick={() => addDemand(NEW_DEMAND_DEFAULTS)}
        >
          <Plus className="h-4 w-4" /> Nova Demanda
        </button>
      </header>

      <div className="px-8 pb-3">
        <KanbanFilters />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-6 scrollbar-thin">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {sortedColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                demands={filteredDemands.filter((d) => d.columnId === column.id).sort((a, b) => a.order - b.order)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDemand ? (
              <div className="card-shadow-drag scale-[1.02] rotate-[1.5deg]">
                <KanbanCard demand={activeDemand} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
