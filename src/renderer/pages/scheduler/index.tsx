import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useScheduler } from './hooks/useScheduler';
import { ScheduleCard } from './components/ScheduleCard';
import { ScheduleModal } from './components/ScheduleModal';
import { ScheduleEmptyState } from './components/ScheduleEmptyState';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';
import type { ScheduledEvent, ScheduleFormData } from './types';

const SchedulerPage: React.FC = () => {
  const { schedules, loading, addSchedule, updateSchedule, deleteSchedule, toggleEnabled } = useScheduler();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledEvent | null>(null);

  const handleEdit = (schedule: ScheduledEvent) => {
    setEditingSchedule(schedule);
    setModalOpen(true);
  };

  const handleSave = async (data: ScheduleFormData) => {
    if (editingSchedule) {
      await updateSchedule(editingSchedule.id, data);
    } else {
      await addSchedule(data);
    }
    setEditingSchedule(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSchedule(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Scheduled Events</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Automate stream title changes, commercials, and more
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#9147ff] rounded-lg hover:bg-[#772ce8] transition shadow-md"
        >
          <Plus className="w-4 h-4" /> New Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {schedules.length === 0 ? (
          <ScheduleEmptyState />
        ) : (
          schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onEdit={handleEdit}
              onDelete={deleteSchedule}
              onToggle={toggleEnabled}
            />
          ))
        )}
      </div>

      <ScheduleModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={editingSchedule}
      />
    </div>
  );
};

export default SchedulerPage;