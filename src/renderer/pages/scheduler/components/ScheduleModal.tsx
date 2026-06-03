import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ScheduleForm } from './ScheduleForm';
import type { ScheduleFormData, ScheduledEvent } from '../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ScheduleFormData) => void;
  initialData?: ScheduledEvent | null;
}

const emptyForm: ScheduleFormData = {
  type: 'stream',
  cronPattern: 'every 30 minutes',
  action: 'runCommercial',
  params: {},
  enabled: true,
};

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = React.useState<ScheduleFormData>(emptyForm);

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        cronPattern: initialData.cronPattern,
        action: initialData.action,
        params: initialData.params,
        enabled: initialData.enabled,
      });
    } else {
      setFormData(emptyForm);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-[var(--border-color)]">
        <div className="sticky top-0 bg-[var(--card-bg)] px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            {initialData ? 'Edit Schedule' : 'New Schedule'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--input-bg)]">
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <ScheduleForm formData={formData} onChange={setFormData} />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--border-color)] transition text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#9147ff] hover:bg-[#772ce8] transition text-white font-medium"
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};