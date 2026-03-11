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
import { useState, useEffect } from 'react';
import type { Demand } from '@/types';
import { KanbanCard } from './KanbanCard';
import { Plus } from 'lucide-react';

export function KanbanBoard() {
  const { columns, demands, filters, selectedDemandId, setSelectedDemand, addDemand, moveDemand } = useStore();
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Keyboard shortcut: 'c' to create
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        // Focus the first column's add button - simplified: just add to backlog
        addDemand({
          title: '',
          description: '',
          clientId: '',
          demandTypeId: 'dt1',
          priority: 'medium',
          assignee: '',
          tags: [],
          columnId: 'backlog',
          startedAt: null,
          finishedAt: null,
          blockedAt: null,
          estimatedEffort: '',
          actualEffort: '',
          isBlocked: false,
          blockerReason: '',
          cancellationReason: '',
          notes: '',
          attachments: [],
        });
      }
    };
    // Disabled for now to avoid accidental creation
    // window.addEventListener('keydown', handler);
    // return () => window.removeEventListener('keydown', handler);
  }, [addDemand]);

  // Filter demands
  const filteredDemands = demands.filter((d) => {
    if (filters.search && !d.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.clientId && d.clientId !== filters.clientId) return false;
    if (filters.demandTypeId && d.demandTypeId !== filters.demandTypeId) return false;
    if (filters.priority && d.priority !== filters.priority) return false;
    if (filters.assignee && d.assignee !== filters.assignee) return false;
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

    // Determine target column
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
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-lg font-medium heading-tight">Demands</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">{filteredDemands.length} demands across {columns.length} columns</p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          onClick={() => {
            addDemand({
              title: 'New Demand',
              description: '',
              clientId: '',
              demandTypeId: 'dt1',
              priority: 'medium',
              assignee: '',
              tags: [],
              columnId: 'backlog',
              startedAt: null,
              finishedAt: null,
              blockedAt: null,
              estimatedEffort: '',
              actualEffort: '',
              isBlocked: false,
              blockerReason: '',
              cancellationReason: '',
              notes: '',
              attachments: [],
            });
          }}
        >
          <Plus className="h-4 w-4" /> New Demand
        </button>
      </header>

      <div className="px-6 pt-4">
        <KanbanFilters />
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pt-4 pb-6 scrollbar-thin">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full">
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
              <div className="card-shadow-drag scale-[1.03] rotate-[2deg]">
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
