import { KanbanBoard } from '@/components/KanbanBoard';
import { DemandDetailModal } from '@/components/DemandDetailModal';
import { useStore } from '@/store';

const Index = () => {
  const { selectedDemandId, setSelectedDemand } = useStore();

  return (
    <>
      <KanbanBoard />
      {selectedDemandId && (
        <DemandDetailModal demandId={selectedDemandId} onClose={() => setSelectedDemand(null)} />
      )}
    </>
  );
};

export default Index;
