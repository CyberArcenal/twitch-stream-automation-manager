import React from 'react';
import { Calendar } from 'lucide-react';

export const ScheduleEmptyState: React.FC = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <Calendar className="w-16 h-16 text-[var(--text-secondary)] opacity-40 mb-4" />
    <p className="text-[var(--text-secondary)] text-lg">No scheduled events yet</p>
    <p className="text-sm text-[var(--text-tertiary)]">Click "New Schedule" to automate stream actions</p>
  </div>
);